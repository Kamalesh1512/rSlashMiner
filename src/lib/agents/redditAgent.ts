import { StateGraph, Annotation } from "@langchain/langgraph";
import {
  analyzeContent,
  checkExistingPost,
  getComments,
  searchReddit,
  storeResult,
} from "@/lib/agents/tools";

// 1. Define the agent state
const StateAnnotation = Annotation.Root({
  agentId: Annotation<string>(),
  query: Annotation<string>(),
  relevanceThreshold: Annotation<string>(),
  businessInterests: Annotation<string[]>(),
  businessDescription: Annotation<string>(),
  posts: Annotation<any[]>(),
  selectedPost: Annotation<any>(),
  comments: Annotation<any[]>(),
  analysis: Annotation<any>(),
  storedResult: Annotation<any>(),
  onProgress: Annotation<((message: string) => void) | undefined>(),
  currentPostIndex: Annotation<number>(),
  hasMorePosts: Annotation<boolean>(),
  nextStep: Annotation<string>(),
  exists:Annotation<boolean>(),
});

// 2. Define node functions

// Search for Reddit posts
async function searchPosts(state: typeof StateAnnotation.State) {
  // Report progress if callback exists
  state.onProgress?.("Searching for relevant posts in r/" + state.query);

  const result = await searchReddit.invoke({
    query: state.query,
    timeframe: "month",
    limit: 5,
  });

  const posts = JSON.parse(result);

  // Report progress if callback exists
  if (posts.length > 0) {
    state.onProgress?.(`Found ${posts.length} posts to analyze`);

    return { posts: posts, currentPostIndex: 0 };
  } else {
    state.onProgress?.("No relevant posts found in this subreddit");
    return { posts: posts, currentPostIndex: -1 };
  }
}

async function pickPost(state: typeof StateAnnotation.State) {
  if (
    !state.posts ||
    state.currentPostIndex === -1 ||
    state.currentPostIndex >= state.posts.length
  ) {
    return { selectedPost: undefined };
  }
  const currentPost = state.posts[state.currentPostIndex];
  const newCurrentPostIndex = state.currentPostIndex + 1;

  // console.log("Current Post", currentPost.title);
  // console.log("currentPostIndex", newCurrentPostIndex);

  state.onProgress?.(
    `Checking if post ID ${currentPost.id} already exists`
  );
  const result = await checkExistingPost.invoke({
    postId: currentPost.id,
  });
  const postExists = JSON.parse(result);
  if (postExists.success) {
    state.onProgress?.("Post already exists in the database. Skipping.");
    console.log("Post already exists skipping", newCurrentPostIndex);
    return { selectedPost: undefined}
  }else{
    state.onProgress?.("Post is new. Proceeding...");
    state.onProgress?.(
      `Selected post ${state.currentPostIndex}/${
        state.posts.length
      }: "${currentPost.title?.substring(0, 50)}..."`
    );
    return { selectedPost: currentPost, currentPostIndex: newCurrentPostIndex };
  }

}

// Get comments from a selected post
async function fetchComments(state: typeof StateAnnotation.State) {
  if (!state.selectedPost) {
    console.log("Post already exists skipping inside fecth comments", state.selectedPost);

    state.onProgress?.("No post selected for comment analysis");
    return { comments: [] };
  }

  state.onProgress?.(
    `Fetching comments for post: "${state.selectedPost.title?.substring(
      0,
      50
    )}..."`
  );

  const comments = await getComments.invoke({
    postId: state.selectedPost.id,
  });

  const parsedComments = JSON.parse(comments);
  state.comments = parsedComments;

  state.onProgress?.(
    `Retrieved ${parsedComments.length} comments for analysis`
  );

  return { comments: parsedComments };
}

// Analyze content (post + top comment combined)
async function analyze(state: typeof StateAnnotation.State) {
  if (!state.selectedPost) {
    console.log("Post already exists skipping inside analyze", state.selectedPost);

    state.onProgress?.("No content available for analysis");
    return {
      analysis: { relevanceScore: 0, matchedKeywords: [], sentimentScore: 0 },
    };
  }

  state.onProgress?.("Analyzing content for relevance to your business");

  const content = `${state.selectedPost.title}

${state.selectedPost.selftext ?? ""}

Top comment:
${state.comments?.[0]?.body ?? ""}`;

  const analysisRaw = await analyzeContent.invoke({
    content,
    businessInterests: state.businessInterests,
    businessDescription: state.businessDescription,
  });

  const matchedJson = analysisRaw.match(/{[^]*?}/);
  if (matchedJson) {
    const analysis = JSON.parse(matchedJson[0]);
    state.onProgress?.(
      `Analysis complete: ${analysis.relevanceScore}% relevance score`
    );
    return { analysis };
  } else {
    state.onProgress?.("Could not parse analysis results");
    return {
      analysis: { relevanceScore: 0, matchedKeywords: [], sentimentScore: 0 },
    };
  }
}

// Gate: determine if content is relevant enough to store
function checkRelevance(state: typeof StateAnnotation.State) {
  const isRelevant = state.analysis?.relevanceScore >= state.relevanceThreshold;

  if (isRelevant) {
    state.onProgress?.(
      `Content is relevant (${state.analysis?.relevanceScore}% > ${state.relevanceThreshold}%) - storing result`
    );
  } else {
    state.onProgress?.(
      `Content is not relevant enough (${state.analysis?.relevanceScore}% < ${state.relevanceThreshold}%) - skipping`
    );
  }

  return isRelevant ? "Store" : "Ignore";
}

// Store result
async function storeToDB(state: typeof StateAnnotation.State) {
  state.onProgress?.("Storing relevant content in database");

  const res = await storeResult.invoke({
    agentId: state.agentId,
    redditPostId: state.selectedPost.id,
    content:
      state.selectedPost.title + "\n\n" + (state.selectedPost.selftext ?? ""),
    author: state.selectedPost.author,
    subreddit: state.selectedPost.subreddit,
    url: state.selectedPost.url,
    score: state.selectedPost.score,
    matchedKeywords: state.analysis.matchedKeywords,
    relevanceScore: state.analysis.relevanceScore,
    sentimentScore: state.analysis.sentimentScore,
  });

  const storedResult = JSON.parse(res);
  state.onProgress?.(
    `Result stored successfully with ID: ${storedResult.resultId}`
  );

  return { storedResult };
}

// Gate 2 to determine the another post is available or not
function checkMorePosts(state: typeof StateAnnotation.State) {
  if (!state.posts || state.currentPostIndex >= state.posts.length) {
    state.onProgress?.("All posts processed");
    return "End";
  }
  return "NextPost";
}

//agent workflow -2
export const advancedGraph = new StateGraph(StateAnnotation)
  .addNode("searchPosts", searchPosts)
  .addNode("pickPost", pickPost)
  .addNode("fetchComments", fetchComments)
  .addNode("analyze", analyze)
  .addNode("storeToDB", storeToDB)
  .addEdge("__start__", "searchPosts")
  .addEdge("searchPosts", "pickPost")
  .addConditionalEdges("pickPost", checkMorePosts, {
    NextPost: "fetchComments",
    End: "__end__",
  })
  .addEdge("fetchComments", "analyze")
  .addConditionalEdges("analyze", checkRelevance, {
    Store: "storeToDB",
    Ignore: "pickPost",
  })
  .addEdge("storeToDB", "pickPost")
  .compile();

// Helper function to run the agent with progress reporting
export async function runAgent(params: {
  agentId: string;
  query: string;
  relevanceThreshold: string;
  businessInterests: string[];
  businessDescription: string;
  onProgress?: (message: string) => void;
}) {
  try {
    const {
      agentId,
      query,
      relevanceThreshold,
      businessInterests,
      businessDescription,
      onProgress,
    } = params;

    // Initialize with all required parameters
    const result = await advancedGraph.invoke({
      agentId,
      query,
      relevanceThreshold,
      businessInterests,
      businessDescription,
      onProgress,
      // These can be undefined as they'll be populated during execution
      posts: undefined,
      selectedPost: undefined,
      comments: undefined,
      analysis: undefined,
      storedResult: undefined,
    });

    return result;
  } catch (error) {
    console.error(`Error running agent for subreddit ${params.query}:`, error);
    throw error;
  }
}

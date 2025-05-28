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
  done: Annotation<boolean>(),
});

// 2. Define node functions

// Search for Reddit posts
async function searchPosts(state: typeof StateAnnotation.State) {
  // Report progress if callback exists
  state.onProgress?.("Searching for relevant posts in r/" + state.query);

  const result = await searchReddit.invoke({
    query: state.query,
  });

  const posts = JSON.parse(result);

  // Report progress if callback exists
  if (posts.length > 0) {
    state.onProgress?.(`Found ${posts.length} posts to analyze`);
    console.log("============= Posts Recieved ============", posts.length);
    return { posts: posts, currentPostIndex: 0 };
  } else {
    state.onProgress?.("No relevant posts found in this subreddit");
    return { posts: posts, currentPostIndex: -1 };
  }
}

async function processNextPost(state: typeof StateAnnotation.State) {
  if (
    !state.posts ||
    state.currentPostIndex === -1 ||
    state.currentPostIndex >= state.posts.length
  ) {
    state.onProgress?.("All posts processed or no posts found");
    return { done: true };
  }

  const currentPost = state.posts[state.currentPostIndex];

  state.onProgress?.(`Checking if post ID ${currentPost.id} already exists`);
  const existsResult = await checkExistingPost.invoke({
    postId: currentPost.id,
  });
  const postExists = JSON.parse(existsResult);

  if (postExists.success) {
    state.onProgress?.("Post already exists. Skipping.");
    return { done: false, currentPostIndex: state.currentPostIndex + 1 };
  }

  state.onProgress?.(
    `Fetching comments for post: "${currentPost.title?.substring(0, 50)}..."`
  );
  const commentsRaw = await getComments.invoke({ postId: currentPost.id });
  const comments = JSON.parse(commentsRaw);
  state.comments = comments;

  const content = `${currentPost.title} ${
    currentPost.selftext ?? ""
  } Top comment: ${comments?.[0]?.body ?? ""}`;
  console.log("++++++++++++ Post details ++++++++++++");
  console.log(currentPost.title);
  const analysisRaw = await analyzeContent.invoke({
    content,
    businessDescription: state.businessDescription,
  });

  let analysis;
  try {
    analysis = JSON.parse(analysisRaw);
  } catch (e) {
    state.onProgress?.("Could not parse analysis results");
    return { done: false, currentPostIndex: state.currentPostIndex + 1 }; // Continue processing next posts (index already incremented)
  }

  state.analysis = analysis;
  state.onProgress?.(
    `Analysis complete: ${analysis.relevanceScore}% relevance score`
  );

  if (analysis.relevanceScore >= state.relevanceThreshold) {
    state.onProgress?.("Storing relevant content");
    const storeRaw = await storeResult.invoke({
      agentId: state.agentId,
      redditPostId: currentPost.id,
      content: currentPost.title + "\n\n" + (currentPost.selftext ?? ""),
      author: currentPost.author,
      subreddit: currentPost.subreddit,
      url: currentPost.url,
      score: currentPost.score,
      postCreatedAt: currentPost.created_utc,
      relevanceScore: analysis.relevanceScore,
      comments: currentPost.num_comments,
      sentimentScore: analysis.sentimentScore,
    });

    const stored = JSON.parse(storeRaw);
    if (!state.storedResult) {
      state.storedResult = [];
    }
    state.storedResult.push(stored);
    state.onProgress?.(`Stored with ID: ${stored.resultId}`);
  } else {
    state.onProgress?.("Post not relevant enough. Skipping.");
  }

  return { done: false, currentPostIndex: state.currentPostIndex + 1 };
}

export const optimizedGraph = new StateGraph(StateAnnotation)
  .addNode("searchPosts", searchPosts)
  .addNode("processNextPost", processNextPost)
  .addEdge("__start__", "searchPosts")
  .addEdge("searchPosts", "processNextPost")
  .addConditionalEdges(
    "processNextPost",
    (state) => (state.done ? "End" : "Continue"),
    {
      Continue: "processNextPost",
      End: "__end__",
    }
  )
  .compile();

// Helper function to run the agent with progress reporting
export async function runAgent(params: {
  agentId: string;
  query: string;
  relevanceThreshold: string;
  businessDescription: string;
  onProgress?: (message: string) => void;
}) {
  try {
    const {
      agentId,
      query,
      relevanceThreshold,
      businessDescription,
      onProgress,
    } = params;

    const result = await optimizedGraph.invoke({
      agentId,
      query,
      relevanceThreshold,
      businessDescription,
      onProgress,
      posts: undefined,
      selectedPost: undefined,
      comments: undefined,
      analysis: undefined,
      storedResult: [], // 👈 initialize empty array
    });

    // console.log("Agent Run :",result)

    // return { storedResult: result.storedResult ?? [] ,analysis:result.analysis  }; // 👈 return all stored results

    return result;
  } catch (error) {
    console.error(`Error running agent for subreddit ${params.query}:`, error);
    throw error;
  }
}

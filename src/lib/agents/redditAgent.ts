// import { ChatOpenAI } from "@langchain/openai";
// import { StateGraph, Annotation } from "@langchain/langgraph";
// import { z } from "zod";
// import { db } from "@/lib/db";
// import { monitoringResults } from "@/lib/db/schema";
// import { eq, InferSelectModel } from "drizzle-orm";
// import { createId } from "@paralleldrive/cuid2";
// import {
//   analyzeContent,
//   getComments,
//   searchReddit,
//   storeResult,
// } from "@/lib/agents/tools";

// // 1. Define the agent state
// const StateAnnotation = Annotation.Root({
//   agentId:Annotation<string>(),
//   subreddit: Annotation<string>(),
//   query: Annotation<string>(),
//   businessInterests: Annotation<string[]>(),
//   businessDescription: Annotation<string>(),
//   posts: Annotation<any[]>(),
//   selectedPost: Annotation<any>(),
//   comments: Annotation<any[]>(),
//   analysis: Annotation<any>(),
//   storedResult: Annotation<any>(),
// });

// // 2. Define node functions

// // Search for Reddit posts
// async function searchPosts(state: typeof StateAnnotation.State) {
//   const result = await searchReddit.invoke({
//     subreddit: state.subreddit,
//     query: state.query,
//   });

//   const posts = JSON.parse(result);
//   return { posts, selectedPost: posts[0] }; // pick first post to continue
// }

// // Get comments from a selected post
// async function fetchComments(state: typeof StateAnnotation.State) {
//   const comments = await getComments.invoke({
//     postId: state.selectedPost.id,
//   });

//   return { comments: JSON.parse(comments) };
// }

// // Analyze content (post + top comment combined)
// async function analyze(state: typeof StateAnnotation.State) {
//   const content = `${state.selectedPost.title}\n\n${
//     state.selectedPost.selftext ?? ""
//   }\n\nTop comment:\n${state.comments?.[0]?.body ?? ""}`;

//   const analysisRaw = await analyzeContent.invoke({
//     content,
//     businessInterests: state.businessInterests,
//     businessDescription: state.businessDescription,
//   });

//   const matchedJson = analysisRaw.match(/{[^]*?}/);
//   if (matchedJson) {
//     const analysis = JSON.parse(matchedJson[0]);
//     console.log("AI Repsonse:",analysis)
//     return { analysis };
//   }

// }

// // Gate: determine if content is relevant enough to store
// function checkRelevance(state: typeof StateAnnotation.State) {
//   return state.analysis.relevanceScore >= 60 ? "Store" : "Ignore";
// }

// // Store result
// async function storeToDB(state: typeof StateAnnotation.State) {
//   const res = await storeResult.invoke({
//     agentId: state.agentId,
//     redditPostId: state.selectedPost.id,
//     content:
//       state.selectedPost.title + "\n\n" + (state.selectedPost.selftext ?? ""),
//     author: state.selectedPost.author,
//     subreddit: state.subreddit,
//     url: state.selectedPost.url,
//     score: state.selectedPost.score,
//     matchedKeywords: state.analysis.matchedKeywords,
//     relevanceScore: state.analysis.relevanceScore,
//     sentimentScore: state.analysis.sentimentScore,
//   });

//   return { storedResult: JSON.parse(res) };
// }

// // 3. Build the agent workflow
// export const graph = new StateGraph(StateAnnotation)
//   .addNode("searchPosts", searchPosts)
//   .addNode("fetchComments", fetchComments)
//   .addNode("analyze", analyze)
//   .addNode("storeToDB", storeToDB)
//   .addEdge("__start__", "searchPosts")
//   .addEdge("searchPosts", "fetchComments")
//   .addEdge("fetchComments", "analyze")
//   .addConditionalEdges("analyze", checkRelevance, {
//     Store: "storeToDB",
//     Ignore: "__end__",
//   })
//   .addEdge("storeToDB", "__end__")
//   .compile();


import { StateGraph, Annotation } from "@langchain/langgraph"
import { analyzeContent, getComments, searchReddit, storeResult } from "@/lib/agents/tools"

// 1. Define the agent state
const StateAnnotation = Annotation.Root({
  agentId: Annotation<string>(),
  subreddit: Annotation<string>(),
  query: Annotation<string>(),
  businessInterests: Annotation<string[]>(),
  businessDescription: Annotation<string>(),
  posts: Annotation<any[]>(),
  selectedPost: Annotation<any>(),
  comments: Annotation<any[]>(),
  analysis: Annotation<any>(),
  storedResult: Annotation<any>(),
  onProgress: Annotation<((message: string) => void) | undefined>(),
})

// 2. Define node functions

// Search for Reddit posts
async function searchPosts(state: typeof StateAnnotation.State) {
  // Report progress if callback exists
  state.onProgress?.("Searching for relevant posts in r/" + state.subreddit)

  const result = await searchReddit.invoke({
    subreddit: state.subreddit,
    query: state.query,
  })

  const posts = JSON.parse(result)

  // Report progress if callback exists
  if (posts.length > 0) {
    state.onProgress?.(`Found ${posts.length} posts to analyze`)
  } else {
    state.onProgress?.("No relevant posts found in this subreddit")
  }

  return { posts, selectedPost: posts[0] } // pick first post to continue
}

// Get comments from a selected post
async function fetchComments(state: typeof StateAnnotation.State) {
  if (!state.selectedPost) {
    state.onProgress?.("No post selected for comment analysis")
    return { comments: [] }
  }

  state.onProgress?.(`Fetching comments for post: "${state.selectedPost.title?.substring(0, 50)}..."`)

  const comments = await getComments.invoke({
    postId: state.selectedPost.id,
  })

  const parsedComments = JSON.parse(comments)

  state.onProgress?.(`Retrieved ${parsedComments.length} comments for analysis`)

  return { comments: parsedComments }
}

// Analyze content (post + top comment combined)
async function analyze(state: typeof StateAnnotation.State) {
  if (!state.selectedPost) {
    state.onProgress?.("No content available for analysis")
    return { analysis: { relevanceScore: 0, matchedKeywords: [], sentimentScore: 0 } }
  }

  state.onProgress?.("Analyzing content for relevance to your business")

  const content = `${state.selectedPost.title}

${state.selectedPost.selftext ?? ""}

Top comment:
${state.comments?.[0]?.body ?? ""}`

  const analysisRaw = await analyzeContent.invoke({
    content,
    businessInterests: state.businessInterests,
    businessDescription: state.businessDescription,
  })

  const matchedJson = analysisRaw.match(/{[^]*?}/)
  if (matchedJson) {
    const analysis = JSON.parse(matchedJson[0])
    state.onProgress?.(`Analysis complete: ${analysis.relevanceScore}% relevance score`)
    return { analysis }
  } else {
    state.onProgress?.("Could not parse analysis results")
    return { analysis: { relevanceScore: 0, matchedKeywords: [], sentimentScore: 0 } }
  }
}

// Gate: determine if content is relevant enough to store
function checkRelevance(state: typeof StateAnnotation.State) {
  const relevanceThreshold = 60
  const isRelevant = state.analysis?.relevanceScore >= relevanceThreshold

  if (isRelevant) {
    state.onProgress?.(
      `Content is relevant (${state.analysis?.relevanceScore}% > ${relevanceThreshold}%) - storing result`,
    )
  } else {
    state.onProgress?.(
      `Content is not relevant enough (${state.analysis?.relevanceScore}% < ${relevanceThreshold}%) - skipping`,
    )
  }

  return isRelevant ? "Store" : "Ignore"
}

// Store result
async function storeToDB(state: typeof StateAnnotation.State) {
  state.onProgress?.("Storing relevant content in database")

  const res = await storeResult.invoke({
    agentId: state.agentId,
    redditPostId: state.selectedPost.id,
    content: state.selectedPost.title + "\n\n" + (state.selectedPost.selftext ?? ""),
    author: state.selectedPost.author,
    subreddit: state.subreddit,
    url: state.selectedPost.url,
    score: state.selectedPost.score,
    matchedKeywords: state.analysis.matchedKeywords,
    relevanceScore: state.analysis.relevanceScore,
    sentimentScore: state.analysis.sentimentScore,
  })

  const storedResult = JSON.parse(res)
  state.onProgress?.(`Result stored successfully with ID: ${storedResult.resultId}`)

  return { storedResult }
}

// 3. Build the agent workflow
export const graph = new StateGraph(StateAnnotation)
  .addNode("searchPosts", searchPosts)
  .addNode("fetchComments", fetchComments)
  .addNode("analyze", analyze)
  .addNode("storeToDB", storeToDB)
  .addEdge("__start__", "searchPosts")
  .addEdge("searchPosts", "fetchComments")
  .addEdge("fetchComments", "analyze")
  .addConditionalEdges("analyze", checkRelevance, {
    Store: "storeToDB",
    Ignore: "__end__",
  })
  .addEdge("storeToDB", "__end__")
  .compile()

// Helper function to run the agent with progress reporting
export async function runAgent(params: {
  agentId: string
  subreddit: string
  query: string
  businessInterests: string[]
  businessDescription: string
  onProgress?: (message: string) => void
}) {
  try {
    const { agentId, subreddit, query, businessInterests, businessDescription, onProgress } = params

    // Initialize with all required parameters
    const result = await graph.invoke({
      agentId,
      subreddit,
      query,
      businessInterests,
      businessDescription,
      onProgress,
      // These can be undefined as they'll be populated during execution
      posts: undefined,
      selectedPost: undefined,
      comments: undefined,
      analysis: undefined,
      storedResult: undefined,
    })

    return result
  } catch (error) {
    console.error(`Error running agent for subreddit ${params.subreddit}:`, error)
    throw error
  }
}

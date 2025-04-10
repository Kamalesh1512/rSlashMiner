import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { db } from "@/lib/db";
import { monitoringResults } from "@/lib/db/schema";
import { eq, InferSelectModel } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import {
  analyzeContent,
  getComments,
  searchReddit,
  storeResult,
} from "@/lib/agents/tools";

// 1. Define the agent state
const StateAnnotation = Annotation.Root({
  agentId:Annotation<string>(),
  subreddit: Annotation<string>(),
  query: Annotation<string>(),
  businessInterests: Annotation<string[]>(),
  businessDescription: Annotation<string>(),
  posts: Annotation<any[]>(),
  selectedPost: Annotation<any>(),
  comments: Annotation<any[]>(),
  analysis: Annotation<any>(),
  storedResult: Annotation<any>(),
});

// 2. Define node functions

// Search for Reddit posts
async function searchPosts(state: typeof StateAnnotation.State) {
  const result = await searchReddit.invoke({
    subreddit: state.subreddit,
    query: state.query,
  });

  const posts = JSON.parse(result);
  return { posts, selectedPost: posts[0] }; // pick first post to continue
}

// Get comments from a selected post
async function fetchComments(state: typeof StateAnnotation.State) {
  const comments = await getComments.invoke({
    postId: state.selectedPost.id,
    subreddit: state.subreddit,
  });

  return { comments: JSON.parse(comments) };
}

// Analyze content (post + top comment combined)
async function analyze(state: typeof StateAnnotation.State) {
  const content = `${state.selectedPost.title}\n\n${
    state.selectedPost.selftext ?? ""
  }\n\nTop comment:\n${state.comments?.[0]?.body ?? ""}`;

  const analysisRaw = await analyzeContent.invoke({
    content,
    businessInterests: state.businessInterests,
    businessDescription: state.businessDescription,
  });

  const analysis = JSON.parse(analysisRaw);
  return { analysis };
}

// Gate: determine if content is relevant enough to store
function checkRelevance(state: typeof StateAnnotation.State) {
  return state.analysis.relevanceScore >= 60 ? "Store" : "Ignore";
}

// Store result
async function storeToDB(state: typeof StateAnnotation.State) {
  const res = await storeResult.invoke({
    agentId: state.agentId,
    redditPostId: state.selectedPost.id,
    content:
      state.selectedPost.title + "\n\n" + (state.selectedPost.selftext ?? ""),
    author: state.selectedPost.author,
    subreddit: state.subreddit,
    url: state.selectedPost.url,
    score: state.selectedPost.score,
    matchedKeywords: state.analysis.matchedKeywords,
    relevanceScore: state.analysis.relevanceScore,
    sentimentScore: state.analysis.sentimentScore,
  });

  return { storedResult: JSON.parse(res) };
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
  .compile();

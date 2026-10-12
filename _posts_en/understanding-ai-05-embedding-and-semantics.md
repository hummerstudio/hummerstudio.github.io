---
title: 'Understanding AI (5): Embedding — How AI Understands Semantics'
date: 2025-11-29
author: Tang Moying
categories: [ai]
tags: [AI, Embedding, Vectors, Semantic Space, Large Language Models, LLM]
lang: en
alt_url: /post/理解AI-05-Embedding与语义
---


## 1. A Strange Question

Have you ever thought about this question:

How does AI know that "apple" and "fruit" mean similar things?

Of course it knows, because AI has "seen" these two words appear together in large amounts of text. But how exactly does it do it?

That brings us to today's topic: **Embedding**.

## 2. From Text to Numbers

To understand Embedding, you first need to understand a basic question: **How does AI represent the word "apple"?**

AI is not magic—it is essentially mathematical operations. To get AI to "process" a word, the first step is **turning the word into numbers**.

This process of conversion is Embedding.

### 2.1 The Simple Version: One-Hot Encoding

The simplest way is **One-Hot encoding**:

Suppose we have a vocabulary of only 5 words: ["apple", "banana", "cat", "dog", "car"].

Then:

- "apple" → [1, 0, 0, 0, 0]
- "banana" → [0, 1, 0, 0, 0]
- "cat" → [0, 0, 1, 0, 0]
- ...

Each word is represented as a vector, in which only the position corresponding to itself in the vocabulary is 1 and everything else is 0.

### 2.2 What's the Problem?

One-Hot encoding has two fatal problems:

1. **Dimensional explosion**: if the vocabulary has 10,000 words, each word is a 10,000-dimensional vector, and both storage and computation are extremely inefficient

2. **No semantic information**:
   - "apple" = [1, 0, 0, 0, 0]
   - "fruit" = [0, 0, 0, 1, 0]

   These two vectors look completely unrelated, yet semantically they are very close.

## 3. The Core Idea of Embedding

**What Embedding does: map words into a dense vector space, so that words with similar meanings also have similar vectors.**

This vector space might be 256-dimensional, 768-dimensional, 1536-dimensional… depending on the model's design.

For example, in a certain Embedding space:

- "apple" → [0.2, -0.5, 0.8, ...]
- "banana" → [0.3, -0.4, 0.7, ...]
- "car" → [-0.8, 0.9, 0.1, ...]

The vectors for "apple" and "banana" are very close (both are fruits), while the vectors for "apple" and "car" are far apart (completely unrelated).

This is the concept of **semantic space**.

## 4. How Does AI Learn This Mapping?

Embedding is not set by hand; AI **learns it by itself during training**.

What is the goal of training? **"Similar words should have similar contexts."**

For example, in large amounts of text:

- "apple" often appears together with "fruit", "eat" and "sweet"
- "banana" often appears together with "fruit", "eat" and "sweet"

Through training, AI discovers that the context patterns of "apple" and "banana" are very similar, so in the vector space it places their vectors very close together.

This is an **unsupervised learning** process—AI does not need humans to label "apple is a fruit"; it discovers this pattern from the corpus itself.

## 5. Vector Similarity: How Do We Measure "Closeness"?

Once every word has been represented as a vector, how do we measure the "degree of closeness" of two words?

The most commonly used method is **cosine similarity**:

```
cosine_similarity(A, B) = (A · B) / (|A| × |B|)
```

Put simply, it computes the cosine of the angle between two vectors:

- Angle of 0° (the vectors are identical) → cosine value = 1
- Angle of 90° (the vectors are perpendicular) → cosine value = 0
- Angle of 180° (the vectors are opposites) → cosine value = -1

The closer the cosine value is to 1, the more "similar" the two vectors are.

## 6. Applications of Embedding

Once you understand Embedding, many AI applications become clear:

### 6.1 Semantic Search

Traditional search is **keyword matching**: search for "apple" and you can only find documents that contain the word "apple".

Semantic search is **vector matching**: convert "apple" and all the documents into vectors, then find the closest ones in the vector space.

This way, even if a document does not contain the word "apple" but mentions "fruit apple", it can still be found—because their vectors are very close.

### 6.2 Recommender Systems

Recommending products is essentially: **find the products whose vectors are close to the products the user likes**.

If a user likes the "iPhone", then in the vector space "iPad", "MacBook" and "AirPods" are very likely to be close to it, so they will be recommended.

### 6.3 RAG (Retrieval-Augmented Generation)

RAG is a very popular AI application pattern right now:

1. Cut the knowledge base documents into small chunks, convert them into vectors, and store them in a vector database
2. When the user asks a question, convert the question into a vector too
3. Find the document chunks in the vector database that are most similar to the question vector
4. Use these document chunks as context and let AI generate the answer

This way, AI can answer questions from "after the knowledge cutoff date", because it finds the latest information through retrieval.

## 7. Not Just Words: Embeddings for Sentences and Documents

The idea of Embedding does not only apply to single words—**it can also be used for sentences, paragraphs and even whole documents**.

sentence-transformers is exactly such a model: it converts a sentence into a vector.

For example:

- "The weather is nice today" → [0.1, -0.3, 0.5, ...]
- "It will be sunny tomorrow" → [0.15, -0.28, 0.48, ...]

These two sentences mean similar things, and their vectors are also very close.

This ability lets AI:

- Determine whether two pieces of text are "talking about the same thing"
- Find "related content" in massive document collections
- Cluster and classify text

## 8. What It Really Is

**Embedding is the process of mapping discrete symbols (text) into a continuous vector space.**

In this vector space, **content with similar semantics has similar vectors**. This space is not set by hand; rather, AI "discovers" it by learning from massive amounts of text—it discovers the statistical regularities in language and then encodes those regularities into the geometric relationships of vectors.

Once you understand Embedding, you understand the foundation of how AI "understands" semantics. It is the technical cornerstone of all semantic search, recommender systems and RAG.

---

## Series Summary

From the first article's "probabilistic prediction", to the second's "Token tokenization", to the third's "context window", to the fourth's "sampling parameters", and now to today's "vector embedding"—together we have explored several core concepts of LLMs.

Chained together, these concepts are the basic logic of how modern large language models work:

> **Text → Token → Vector (Embedding) → Predict the Next Token → Sampled Output**

Once you understand this chain, you have an essential understanding of AI, instead of just staying at the level of "how to use it".

I hope this series has been helpful to you. If there are other topics you would like to know about, feel free to tell me!

A small step forward every day is a new height!

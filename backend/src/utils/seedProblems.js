require("dotenv").config();

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Problem = require("../models/Problem");

const catalog = [
    {
        name: "Arrays",
        difficulty: "easy",
        problems: [
            ["Two Sum", "easy"],
            ["Best Time to Buy and Sell Stock", "easy"],
            ["Product of Array Except Self", "medium"],
            ["Maximum Subarray", "medium"],
            ["Trapping Rain Water", "hard"]
        ]
    },
    {
        name: "Strings",
        difficulty: "easy",
        problems: [
            ["Valid Anagram", "easy"],
            ["Group Anagrams", "medium"],
            ["Longest Substring Without Repeating Characters", "medium"],
            ["Longest Palindromic Substring", "medium"],
            ["Minimum Window Substring", "hard"]
        ]
    },
    {
        name: "Linked List",
        difficulty: "easy",
        problems: [
            ["Reverse Linked List", "easy"],
            ["Merge Two Sorted Lists", "easy"],
            ["Linked List Cycle", "easy"],
            ["Remove Nth Node From End of List", "medium"],
            ["Add Two Numbers", "medium"]
        ]
    },
    {
        name: "Binary Search",
        difficulty: "medium",
        problems: [
            ["Binary Search", "easy"],
            ["Search in Rotated Sorted Array", "medium"],
            ["Find Minimum in Rotated Sorted Array", "medium"],
            ["Koko Eating Bananas", "medium"],
            ["Median of Two Sorted Arrays", "hard"]
        ]
    },
    {
        name: "Trees",
        difficulty: "medium",
        problems: [
            ["Maximum Depth of Binary Tree", "easy"],
            ["Invert Binary Tree", "easy"],
            ["Binary Tree Level Order Traversal", "medium"],
            ["Validate Binary Search Tree", "medium"],
            ["Lowest Common Ancestor of a Binary Tree", "medium"]
        ]
    },
    {
        name: "Graphs",
        difficulty: "medium",
        problems: [
            ["Number of Islands", "medium"],
            ["Clone Graph", "medium"],
            ["Course Schedule", "medium"],
            ["Rotting Oranges", "medium"],
            ["Word Ladder", "hard"]
        ]
    },
    {
        name: "Dynamic Programming",
        difficulty: "medium",
        problems: [
            ["Climbing Stairs", "easy"],
            ["House Robber", "medium"],
            ["Coin Change", "medium"],
            ["Longest Common Subsequence", "medium"],
            ["Edit Distance", "hard"]
        ]
    },
    {
        name: "Stacks & Queues",
        difficulty: "easy",
        problems: [
            ["Valid Parentheses", "easy"],
            ["Min Stack", "medium"],
            ["Daily Temperatures", "medium"],
            ["Evaluate Reverse Polish Notation", "medium"],
            ["Largest Rectangle in Histogram", "hard"]
        ]
    }
];

const seedProblems = async () => {
    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
        console.error("Usage: node src/utils/seedProblems.js <user-email>");
        process.exit(1);
    }

    await connectDB();

    try {
        const user = await User.findOne({ email });

        if (!user) {
            throw new Error(`No user found for ${email}`);
        }

        let topicsCreated = 0;
        let problemsCreated = 0;

        for (const topicData of catalog) {
            let topic = await Topic.findOne({ user: user._id, name: topicData.name });

            if (!topic) {
                topic = await Topic.create({
                    user: user._id,
                    name: topicData.name,
                    difficulty: topicData.difficulty
                });
                topicsCreated += 1;
            }

            for (const [title, difficulty] of topicData.problems) {
                const exists = await Problem.exists({
                    user: user._id,
                    topic: topic._id,
                    title
                });

                if (!exists) {
                    await Problem.create({
                        user: user._id,
                        topic: topic._id,
                        title,
                        difficulty,
                        platform: "LeetCode",
                        status: "not-started"
                    });
                    problemsCreated += 1;
                }
            }
        }

        console.log(`Seed complete: ${topicsCreated} topics and ${problemsCreated} problems created for ${email}.`);
    } finally {
        await mongoose.disconnect();
    }
};

seedProblems().catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
});

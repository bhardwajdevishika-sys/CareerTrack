const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Problem = require("../models/Problem");
const generateToken = require("../utils/generateToken");

const defaultTopics = [
    { name: "Arrays", difficulty: "easy" },
    { name: "Strings", difficulty: "easy" },
    { name: "Linked List", difficulty: "easy" },
    { name: "Stacks & Queues", difficulty: "easy" },
    { name: "Binary Search", difficulty: "medium" },
    { name: "Trees", difficulty: "medium" },
    { name: "Graphs", difficulty: "medium" },
    { name: "Dynamic Programming", difficulty: "medium" },
    { name: "Greedy", difficulty: "medium" },
    { name: "Backtracking", difficulty: "medium" }
];

const defaultProblems = {
    Arrays: [
        { title: "Two Sum", difficulty: "easy", platform: "LeetCode" },
        { title: "Best Time to Buy and Sell Stock", difficulty: "easy", platform: "LeetCode" },
        { title: "Contains Duplicate", difficulty: "easy", platform: "LeetCode" },
        { title: "Move Zeroes", difficulty: "easy", platform: "LeetCode" },
        { title: "Remove Duplicates from Sorted Array", difficulty: "easy", platform: "LeetCode" },
        { title: "Find the Largest Element in an Array", difficulty: "easy", platform: "GFG" },
        { title: "Product of Array Except Self", difficulty: "medium", platform: "LeetCode" },
        { title: "3Sum", difficulty: "medium", platform: "LeetCode" },
        { title: "Maximum Subarray", difficulty: "medium", platform: "LeetCode" },
        { title: "Sort Colors", difficulty: "medium", platform: "LeetCode" },
        { title: "Subarray Sum Equals K", difficulty: "medium", platform: "LeetCode" },
        { title: "Leaders in an Array", difficulty: "medium", platform: "GFG" },
        { title: "First Missing Positive", difficulty: "hard", platform: "LeetCode" },
        { title: "Trapping Rain Water", difficulty: "hard", platform: "LeetCode" },
        { title: "Count Inversions", difficulty: "hard", platform: "GFG" }
    ],
    Strings: [
        { title: "Valid Palindrome", difficulty: "easy", platform: "LeetCode" },
        { title: "Valid Anagram", difficulty: "easy", platform: "LeetCode" },
        { title: "Reverse Words in a String", difficulty: "easy", platform: "GFG" },
        { title: "Longest Common Prefix", difficulty: "easy", platform: "LeetCode" },
        { title: "Isomorphic Strings", difficulty: "easy", platform: "LeetCode" },
        { title: "Roman to Integer", difficulty: "easy", platform: "LeetCode" },
        { title: "Longest Substring Without Repeating Characters", difficulty: "medium", platform: "LeetCode" },
        { title: "Group Anagrams", difficulty: "medium", platform: "LeetCode" },
        { title: "String to Integer", difficulty: "medium", platform: "LeetCode" },
        { title: "Longest Palindromic Substring", difficulty: "medium", platform: "LeetCode" },
        { title: "Minimum Characters to Add at Front for Palindrome", difficulty: "medium", platform: "GFG" },
        { title: "Count and Say", difficulty: "medium", platform: "LeetCode" },
        { title: "Minimum Window Substring", difficulty: "hard", platform: "LeetCode" },
        { title: "Regular Expression Matching", difficulty: "hard", platform: "LeetCode" },
        { title: "Word Break II", difficulty: "hard", platform: "LeetCode" }
    ],
    "Linked List": [
        { title: "Reverse Linked List", difficulty: "easy", platform: "LeetCode" },
        { title: "Merge Two Sorted Lists", difficulty: "easy", platform: "LeetCode" },
        { title: "Linked List Cycle", difficulty: "easy", platform: "LeetCode" },
        { title: "Middle of the Linked List", difficulty: "easy", platform: "LeetCode" },
        { title: "Delete Node in a Linked List", difficulty: "easy", platform: "LeetCode" },
        { title: "Count Nodes of Linked List", difficulty: "easy", platform: "GFG" },
        { title: "Add Two Numbers", difficulty: "medium", platform: "LeetCode" },
        { title: "Remove Nth Node From End of List", difficulty: "medium", platform: "LeetCode" },
        { title: "Reorder List", difficulty: "medium", platform: "LeetCode" },
        { title: "Copy List with Random Pointer", difficulty: "medium", platform: "LeetCode" },
        { title: "Rotate List", difficulty: "medium", platform: "LeetCode" },
        { title: "Flattening a Linked List", difficulty: "medium", platform: "GFG" },
        { title: "Merge k Sorted Lists", difficulty: "hard", platform: "LeetCode" },
        { title: "Reverse Nodes in k-Group", difficulty: "hard", platform: "LeetCode" },
        { title: "Sort a Linked List", difficulty: "hard", platform: "GFG" }
    ],
    "Stacks & Queues": [
        { title: "Valid Parentheses", difficulty: "easy", platform: "LeetCode" },
        { title: "Implement Queue using Stacks", difficulty: "easy", platform: "LeetCode" },
        { title: "Implement Stack using Queues", difficulty: "easy", platform: "LeetCode" },
        { title: "Next Greater Element I", difficulty: "easy", platform: "LeetCode" },
        { title: "Queue Using Two Stacks", difficulty: "easy", platform: "GFG" },
        { title: "Min Stack", difficulty: "easy", platform: "LeetCode" },
        { title: "Daily Temperatures", difficulty: "medium", platform: "LeetCode" },
        { title: "Evaluate Reverse Polish Notation", difficulty: "medium", platform: "LeetCode" },
        { title: "Asteroid Collision", difficulty: "medium", platform: "LeetCode" },
        { title: "Generate Parentheses", difficulty: "medium", platform: "LeetCode" },
        { title: "First Non-Repeating Character in a Stream", difficulty: "medium", platform: "GFG" },
        { title: "Sliding Window Maximum", difficulty: "medium", platform: "LeetCode" },
        { title: "Largest Rectangle in Histogram", difficulty: "hard", platform: "LeetCode" },
        { title: "Maximum of Minimum for Every Window Size", difficulty: "hard", platform: "GFG" },
        { title: "Basic Calculator", difficulty: "hard", platform: "LeetCode" }
    ],
    "Binary Search": [
        { title: "Binary Search", difficulty: "easy", platform: "LeetCode" },
        { title: "Search Insert Position", difficulty: "easy", platform: "LeetCode" },
        { title: "Sqrt(x)", difficulty: "easy", platform: "LeetCode" },
        { title: "First and Last Position of Element", difficulty: "easy", platform: "LeetCode" },
        { title: "Floor in a Sorted Array", difficulty: "easy", platform: "GFG" },
        { title: "Find Peak Element", difficulty: "easy", platform: "LeetCode" },
        { title: "Search in Rotated Sorted Array", difficulty: "medium", platform: "LeetCode" },
        { title: "Find Minimum in Rotated Sorted Array", difficulty: "medium", platform: "LeetCode" },
        { title: "Koko Eating Bananas", difficulty: "medium", platform: "LeetCode" },
        { title: "Capacity To Ship Packages Within D Days", difficulty: "medium", platform: "LeetCode" },
        { title: "Aggressive Cows", difficulty: "medium", platform: "GFG" },
        { title: "Median of Two Sorted Arrays", difficulty: "medium", platform: "LeetCode" },
        { title: "Split Array Largest Sum", difficulty: "hard", platform: "LeetCode" },
        { title: "Allocate Minimum Number of Pages", difficulty: "hard", platform: "GFG" },
        { title: "Find in Mountain Array", difficulty: "hard", platform: "LeetCode" }
    ],
    Trees: [
        { title: "Binary Tree Inorder Traversal", difficulty: "easy", platform: "LeetCode" },
        { title: "Maximum Depth of Binary Tree", difficulty: "easy", platform: "LeetCode" },
        { title: "Same Tree", difficulty: "easy", platform: "LeetCode" },
        { title: "Invert Binary Tree", difficulty: "easy", platform: "LeetCode" },
        { title: "Balanced Binary Tree", difficulty: "easy", platform: "LeetCode" },
        { title: "Preorder Traversal", difficulty: "easy", platform: "GFG" },
        { title: "Binary Tree Level Order Traversal", difficulty: "medium", platform: "LeetCode" },
        { title: "Validate Binary Search Tree", difficulty: "medium", platform: "LeetCode" },
        { title: "Lowest Common Ancestor of a Binary Tree", difficulty: "medium", platform: "LeetCode" },
        { title: "Construct Binary Tree from Preorder and Inorder", difficulty: "medium", platform: "LeetCode" },
        { title: "Boundary Traversal of Binary Tree", difficulty: "medium", platform: "GFG" },
        { title: "Kth Smallest Element in a BST", difficulty: "medium", platform: "LeetCode" },
        { title: "Binary Tree Maximum Path Sum", difficulty: "hard", platform: "LeetCode" },
        { title: "Serialize and Deserialize Binary Tree", difficulty: "hard", platform: "LeetCode" },
        { title: "Vertical Order Traversal of Binary Tree", difficulty: "hard", platform: "GFG" }
    ],
    Graphs: [
        { title: "Find the Number of Islands", difficulty: "easy", platform: "GFG" },
        { title: "Flood Fill", difficulty: "easy", platform: "LeetCode" },
        { title: "Find Center of Star Graph", difficulty: "easy", platform: "LeetCode" },
        { title: "BFS of Graph", difficulty: "easy", platform: "GFG" },
        { title: "DFS of Graph", difficulty: "easy", platform: "GFG" },
        { title: "Find if Path Exists in Graph", difficulty: "easy", platform: "LeetCode" },
        { title: "Number of Provinces", difficulty: "medium", platform: "LeetCode" },
        { title: "Clone Graph", difficulty: "medium", platform: "LeetCode" },
        { title: "Course Schedule", difficulty: "medium", platform: "LeetCode" },
        { title: "Rotting Oranges", difficulty: "medium", platform: "LeetCode" },
        { title: "Detect Cycle in an Undirected Graph", difficulty: "medium", platform: "GFG" },
        { title: "Network Delay Time", difficulty: "medium", platform: "LeetCode" },
        { title: "Word Ladder", difficulty: "hard", platform: "LeetCode" },
        { title: "Critical Connections in a Network", difficulty: "hard", platform: "LeetCode" },
        { title: "Strongly Connected Components", difficulty: "hard", platform: "GFG" }
    ],
    "Dynamic Programming": [
        { title: "Climbing Stairs", difficulty: "easy", platform: "LeetCode" },
        { title: "Fibonacci Number", difficulty: "easy", platform: "LeetCode" },
        { title: "House Robber", difficulty: "easy", platform: "LeetCode" },
        { title: "Min Cost Climbing Stairs", difficulty: "easy", platform: "LeetCode" },
        { title: "N-th Tribonacci Number", difficulty: "easy", platform: "LeetCode" },
        { title: "Maximum Sum of Non-Adjacent Elements", difficulty: "easy", platform: "GFG" },
        { title: "Coin Change", difficulty: "medium", platform: "LeetCode" },
        { title: "Longest Increasing Subsequence", difficulty: "medium", platform: "LeetCode" },
        { title: "Partition Equal Subset Sum", difficulty: "medium", platform: "LeetCode" },
        { title: "Decode Ways", difficulty: "medium", platform: "LeetCode" },
        { title: "0/1 Knapsack", difficulty: "medium", platform: "GFG" },
        { title: "Unique Paths", difficulty: "medium", platform: "LeetCode" },
        { title: "Edit Distance", difficulty: "hard", platform: "LeetCode" },
        { title: "Longest Common Subsequence", difficulty: "hard", platform: "LeetCode" },
        { title: "Burst Balloons", difficulty: "hard", platform: "LeetCode" }
    ],
    Greedy: [
        { title: "Assign Cookies", difficulty: "easy", platform: "LeetCode" },
        { title: "Lemonade Change", difficulty: "easy", platform: "LeetCode" },
        { title: "Best Time to Buy and Sell Stock II", difficulty: "easy", platform: "LeetCode" },
        { title: "Minimum Sum of Four Digit Number", difficulty: "easy", platform: "LeetCode" },
        { title: "Activity Selection", difficulty: "easy", platform: "GFG" },
        { title: "Minimum Number of Coins", difficulty: "easy", platform: "GFG" },
        { title: "Jump Game", difficulty: "medium", platform: "LeetCode" },
        { title: "Gas Station", difficulty: "medium", platform: "LeetCode" },
        { title: "Partition Labels", difficulty: "medium", platform: "LeetCode" },
        { title: "Non-overlapping Intervals", difficulty: "medium", platform: "LeetCode" },
        { title: "Job Sequencing Problem", difficulty: "medium", platform: "GFG" },
        { title: "Candy", difficulty: "medium", platform: "LeetCode" },
        { title: "Jump Game II", difficulty: "hard", platform: "LeetCode" },
        { title: "Minimum Cost to Cut a Board Into Squares", difficulty: "hard", platform: "GFG" },
        { title: "N Meetings in One Room", difficulty: "hard", platform: "GFG" }
    ],
    Backtracking: [
        { title: "Subsets", difficulty: "easy", platform: "LeetCode" },
        { title: "Binary String With No Consecutive 1s", difficulty: "easy", platform: "GFG" },
        { title: "Letter Combinations of a Phone Number", difficulty: "easy", platform: "LeetCode" },
        { title: "Generate Parentheses", difficulty: "easy", platform: "LeetCode" },
        { title: "Permutations of a String", difficulty: "easy", platform: "GFG" },
        { title: "Power Set", difficulty: "easy", platform: "GFG" },
        { title: "Combination Sum", difficulty: "medium", platform: "LeetCode" },
        { title: "Permutations", difficulty: "medium", platform: "LeetCode" },
        { title: "Word Search", difficulty: "medium", platform: "LeetCode" },
        { title: "Palindrome Partitioning", difficulty: "medium", platform: "LeetCode" },
        { title: "Rat in a Maze", difficulty: "medium", platform: "GFG" },
        { title: "Combination Sum II", difficulty: "medium", platform: "LeetCode" },
        { title: "N-Queens", difficulty: "hard", platform: "LeetCode" },
        { title: "Sudoku Solver", difficulty: "hard", platform: "GFG" },
        { title: "Word Break II", difficulty: "hard", platform: "LeetCode" }
    ]
};

const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    college: user.college,
    degree: user.degree,
    graduationYear: user.graduationYear,
    targetRole: user.targetRole,
    targetCompanies: user.targetCompanies,
    skills: user.skills,
    bio: user.bio,
    dailyGoal: user.dailyGoal,
    dailyStudyGoalMinutes: user.dailyStudyGoalMinutes,
    xp: user.xp,
    level: user.level,
    coins: user.coins,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    streakFreezes: user.streakFreezes,
    lastActiveDate: user.lastActiveDate,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

// Registers a user after validation, then returns a signed authentication token.
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const createdTopics = await Topic.insertMany(defaultTopics.map((topic) => ({
            ...topic,
            user: user._id,
            progress: "not-started",
            problemsSolved: 0
        })));

        const problemsToCreate = createdTopics.flatMap((topic) =>
            defaultProblems[topic.name].map((problem) => ({
                ...problem,
                user: user._id,
                topic: topic._id,
                status: "not-started"
            }))
        );

        await Problem.insertMany(problemsToCreate);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token: generateToken(user._id),
            user: formatUser(user)
        });
    } catch (error) {
        next(error);
    }
};

// Verifies credentials and returns a fresh token without exposing the password.
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: generateToken(user._id),
            user: formatUser(user)
        });
    } catch (error) {
        next(error);
    }
};

// Returns the user attached by the authentication middleware.
const getProfile = (req, res) => {
    return res.status(200).json({
        success: true,
        user: formatUser(req.user)
    });
};

// Updates the authenticated user's permitted profile fields.
const updateProfile = async (req, res, next) => {
    try {
        const {
            name, email,
            college, degree, graduationYear, targetRole, targetCompanies,
            skills, bio, dailyGoal, dailyStudyGoalMinutes
        } = req.body;
        const user = req.user;

        if (email !== undefined) {
            const normalizedEmail = email.toLowerCase();
            const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(409).json({ success: false, message: "An account with this email already exists" });
            }
            user.email = normalizedEmail;
        }

        if (name !== undefined) user.name = name.trim();
        if (college !== undefined) user.college = college;
        if (degree !== undefined) user.degree = degree;
        if (graduationYear !== undefined) user.graduationYear = graduationYear;
        if (targetRole !== undefined) user.targetRole = targetRole;
        if (targetCompanies !== undefined) user.targetCompanies = targetCompanies;
        if (skills !== undefined) user.skills = skills;
        if (bio !== undefined) user.bio = bio;
        if (dailyGoal !== undefined) user.dailyGoal = dailyGoal;
        if (dailyStudyGoalMinutes !== undefined) user.dailyStudyGoalMinutes = dailyStudyGoalMinutes;

        const updatedUser = await user.save();
        return res.status(200).json({ success: true, message: "Profile updated successfully", user: formatUser(updatedUser) });
    } catch (error) {
        next(error);
    }
};

// JWTs remain stateless; the client clears its stored token to log out.
const logout = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logout successful. Remove the token from the client."
    });
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    logout
};

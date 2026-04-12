import random


def ai_evaluate_answer(question, code):
    return {
        "correctness": "Partial",
        "time_complexity": "O(n)",
        "space_complexity": "O(1)",
        "code_quality": 7,
        "edge_cases": "Not fully handled",
        "mistakes": ["Missed edge case"],
        "suggestions": ["Use better approach"],
        "score": 6,
    }


QUESTION_BANK = {
    "easy": [
        {
            "type": "coding",
            "question": "Given two integers a and b, print their sum.",
            "examples": [{"input": "2 3", "output": "5"}],
            "constraints": "-10^9 <= a, b <= 10^9",
            "expected_complexity": "O(1)",
        },
        {
            "type": "coding",
            "question": "Given an integer n, print 'Even' if n is even else print 'Odd'.",
            "examples": [{"input": "7", "output": "Odd"}],
            "constraints": "-10^9 <= n <= 10^9",
            "expected_complexity": "O(1)",
        },
        {
            "type": "coding",
            "question": "Given a string s, print the reversed string.",
            "examples": [{"input": "code", "output": "edoc"}],
            "constraints": "1 <= len(s) <= 10^5",
            "expected_complexity": "O(n)",
        },
        {
            "type": "coding",
            "question": "Given n numbers, print the maximum value.",
            "examples": [{"input": "5\n3 9 1 8 4", "output": "9"}],
            "constraints": "1 <= n <= 10^5",
            "expected_complexity": "O(n)",
        },
        {
            "type": "theory",
            "question": "Explain the difference between a list and a tuple in Python, and when you would choose each.",
            "examples": [],
            "constraints": "Answer in 4-6 concise points.",
            "expected_complexity": "Conceptual",
        },
        {
            "type": "theory",
            "question": "What is Big-O notation and why do interviewers care about it?",
            "examples": [],
            "constraints": "Give a short definition and one practical example.",
            "expected_complexity": "Conceptual",
        },
    ],
    "medium": [
        {
            "type": "coding",
            "question": "Given an array, return indices of two numbers whose sum equals target.",
            "examples": [{"input": "nums=[2,7,11,15], target=9", "output": "[0,1]"}],
            "constraints": "2 <= n <= 10^5",
            "expected_complexity": "O(n)",
        },
        {
            "type": "coding",
            "question": "Given a string, find the length of the longest substring without repeating characters.",
            "examples": [{"input": "abcabcbb", "output": "3"}],
            "constraints": "0 <= len(s) <= 10^5",
            "expected_complexity": "O(n)",
        },
        {
            "type": "coding",
            "question": "Given n numbers, output the top k frequent elements.",
            "examples": [{"input": "nums=[1,1,1,2,2,3], k=2", "output": "[1,2]"}],
            "constraints": "1 <= n <= 10^5",
            "expected_complexity": "O(n log n)",
        },
        {
            "type": "coding",
            "question": "Given a list of intervals, merge all overlapping intervals.",
            "examples": [{"input": "[[1,3],[2,6],[8,10],[15,18]]", "output": "[[1,6],[8,10],[15,18]]"}],
            "constraints": "1 <= intervals.length <= 10^4",
            "expected_complexity": "O(n log n)",
        },
        {
            "type": "theory",
            "question": "Compare BFS and DFS. When is one preferable over the other?",
            "examples": [],
            "constraints": "Mention memory usage and at least one real use-case.",
            "expected_complexity": "Conceptual",
        },
        {
            "type": "theory",
            "question": "What are hash collisions and how are they commonly handled in hash tables?",
            "examples": [],
            "constraints": "Cover at least two collision handling strategies.",
            "expected_complexity": "Conceptual",
        },
    ],
    "hard": [
        {
            "type": "coding",
            "question": "Design an LRU Cache supporting get and put in O(1).",
            "examples": [{"input": "capacity=2; put(1,1), put(2,2), get(1)", "output": "1"}],
            "constraints": "1 <= capacity <= 3000",
            "expected_complexity": "O(1)",
        },
        {
            "type": "coding",
            "question": "Find the median of two sorted arrays with total complexity O(log(m+n)).",
            "examples": [{"input": "nums1=[1,3], nums2=[2]", "output": "2.0"}],
            "constraints": "0 <= m,n <= 10^5",
            "expected_complexity": "O(log(min(m,n)))",
        },
        {
            "type": "coding",
            "question": "Given a weighted graph, implement Dijkstra to find shortest path from source to all nodes.",
            "examples": [{"input": "n=5, edges=[...], source=0", "output": "distances array"}],
            "constraints": "1 <= n <= 10^5",
            "expected_complexity": "O((V+E) log V)",
        },
        {
            "type": "coding",
            "question": "Implement Trie with insert, search, and startsWith operations.",
            "examples": [{"input": "insert('apple'), search('apple'), startsWith('app')", "output": "true,true"}],
            "constraints": "1 <= word.length <= 2000",
            "expected_complexity": "O(L) per operation",
        },
        {
            "type": "theory",
            "question": "How would you design a scalable URL shortener? Discuss API, storage, and bottlenecks.",
            "examples": [],
            "constraints": "Include trade-offs and failure handling.",
            "expected_complexity": "System Design",
        },
        {
            "type": "theory",
            "question": "Explain CAP theorem with a practical distributed systems example.",
            "examples": [],
            "constraints": "State what is sacrificed under a partition for your example.",
            "expected_complexity": "Distributed Systems",
        },
    ],
}


def ai_generate_question(data):
    requested = str(data.get("difficulty", "easy")).strip().lower()
    difficulty = requested if requested in QUESTION_BANK else "easy"
    domain = data.get("domain", "Python")

    template = random.choice(QUESTION_BANK[difficulty])
    return {
        "question": f"[{difficulty.upper()}] {template['question']}",
        "question_type": template.get("type", "coding"),
        "examples": template.get("examples", []),
        "constraints": template.get("constraints", ""),
        "expected_complexity": template.get("expected_complexity", ""),
        "domain": domain,
    }

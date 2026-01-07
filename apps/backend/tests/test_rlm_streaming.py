"""Test RLM streaming with async execution."""

import asyncio

import dspy
from app.domains.rlm.service import RLM


# Mock LM
class MockLM(dspy.LM):
    def __init__(self):
        super().__init__(model="mock")

    def basic_request(self, prompt, **kwargs):
        # Structured for ReAct
        return ["Thought: I should check streaming async.\nAction: execute_python\nAction Input: print('async works')"]

    def __call__(self, prompt=None, messages=None, **kwargs):
        return self.basic_request(prompt or messages, **kwargs)

async def test_async_streamify():
    dspy.configure(lm=MockLM())

    steps = []
    def callback(step):
        steps.append(step)
        print(f"Captured: {step['type']} -> {step['content'][:40]}...")

    rlm = RLM("context", step_callback=callback)

    print("Starting async forward pass...")
    try:
        # Await the async method
        result = await rlm.forward("Test async query")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Execution finished/error: {e}")

    thoughts = [s for s in steps if s['type'] == 'thinking']
    print(f"\nThoughts captured: {len(thoughts)}")

    if len(thoughts) > 1:
        print("✅ PASSED: Captured streamed thoughts in async context")
    else:
        print("❌ FAILED: No thoughts streamed")

if __name__ == "__main__":
    asyncio.run(test_async_streamify())

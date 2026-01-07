"""Test WebSocket endpoints for RLM streaming."""

import asyncio
import json

import websockets


async def test_ws(uri):
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            if "ws_test" in uri:
                msg = await websocket.recv()
                print(f"Test WS Response: {msg}")
                return
            payload = {
                "query": "What is 1+1?",
                "context": "1+1 is 2"
            }
            await websocket.send(json.dumps(payload))
            print(f"Sent: {payload}")

            async for message in websocket:
                data = json.loads(message)
                print(f"Received: {data}")
                if data.get("type") == "final":
                    break
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    print("Testing /api/rlm/stream...")
    loop.run_until_complete(test_ws("ws://127.0.0.1:8000/api/rlm/stream"))
    print("\nTesting /ws_test...")
    loop.run_until_complete(test_ws("ws://127.0.0.1:8000/ws_test"))

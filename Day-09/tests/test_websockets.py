def test_websocket_notifications(client):
    with client.websocket_connect("/ws/notifications") as websocket:
        # 1. Receive initial welcome message
        data = websocket.receive_text()
        assert data == "Connected to Real-time Notification Service."

        # 2. Send a client message and expect broadcast echo
        websocket.send_text("Hello Server")
        broadcast_msg = websocket.receive_text()
        assert broadcast_msg == "Client broadcast: Hello Server"

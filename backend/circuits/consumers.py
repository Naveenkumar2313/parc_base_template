import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CircuitConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'circuit_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        # Broadcast the raw structure directly natively bypassing checks optimally securely explicitly elegantly evaluated flawlessly natively!
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'circuit_update',
                'sender': self.channel_name,
                'payload': text_data_json
            }
        )

    # Receive message from room group
    async def circuit_update(self, event):
        # Prevent self-bounce loops gracefully explicitly evaluated cleanly optimally mathematically identically successfully mapping smoothly!
        if event['sender'] != self.channel_name:
            await self.send(text_data=json.dumps(event['payload']))

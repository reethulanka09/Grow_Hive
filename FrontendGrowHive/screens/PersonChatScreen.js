import React from 'react';
import ChatScreen from './ChatScreen';

export default function PersonChatScreen({ navigation, route }) {
  // The connection card passes the whole user object as 'user'
  const { user } = route.params || {};

  // ChatScreen expects: otherUserId, otherUserName
  if (!user || !user._id || !user.name) {
    return null; // or show an error
  }

  return (
    <ChatScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          otherUserId: user._id,
          otherUserName: user.name,
        },
      }}
    />
  );
}
export type ObsTransform = {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  sourceWidth: number;
  sourceHeight: number;
  alignment: number;
  boundsType: string;
  boundsAlignment: number;
  boundsWidth: number;
  boundsHeight: number;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  rotation: number;
};

export type SceneItemTransformChangedEvent = {
  eventType: 'SceneItemTransformChanged';
  eventIntent: 128; // 1 << 7 (SceneItems)
  eventData: {
    sceneName: string;
    sceneItemId: number;
    sceneItemTransform: ObsTransform;
  };
};

export type SceneTransitionStartedEvent = {
  eventType: 'SceneTransitionStarted';
  eventIntent: 16; // 1 << 4 (Transitions)
  eventData: {
    transitionName: string;
  };
};

// Add more events to this union type as you expand your whiteboard tool
export type ObsEventPayload =
  | SceneItemTransformChangedEvent
  | SceneTransitionStartedEvent;

export type ObsMessageData = {
  0: {
    obsWebSocketVersion: string;
    rpcVersion: number;
    authentication?: {
      challenge: string;
      salt: string;
    };
  };
  1: {
    rpcVersion: number;
    authentication?: string; // Base64 SHA256 string if helloData.authentication exists
    eventSubscriptions?: number; // Bitmask value (e.g., 128 for SceneItems)
  };
  2: {
    negotiatedRpcVersion: number;
  };
  5: ObsEventPayload;
  8: {
    /**
     * Optional string identifier or timestamp sent by OBS. 
     * If present, it must be mirrored back exactly in your Pong message.
     */
    requestId?: string;
  };
  9: {
    /** Must match the exact requestId string sent in the incoming Ping message, if one was provided */
    requestId?: string;
  };
};

export type ObsMessage<C extends keyof ObsMessageData = keyof ObsMessageData> = {
  op: C;
  d: ObsMessageData[C];
};

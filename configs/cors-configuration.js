'use strict';

import cors from 'cors';

const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Required so browsers can read custom response headers via JS (fetch/axios)
    exposedHeaders: ['X-Wake-Word', 'X-Emotion', 'X-Risk', 'X-Language', 'X-Transcription', 'X-Response'],
};

export { corsOptions };

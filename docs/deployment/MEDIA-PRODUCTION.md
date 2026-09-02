# Drustpoll production media requirements

The media pipeline intentionally fails closed when its external providers are not configured. It never reports an upload, rendition, extraction or moderation result as successful just because a request reached the server.

## Required storage configuration

- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- optional `S3_ENDPOINT` for an S3-compatible provider
- optional `S3_FORCE_PATH_STYLE=true` where required
- optional signed URL TTL settings

The API issues short-lived signed upload URLs. Completion re-checks the stored object's size/type and then requires content inspection.

## Required media inspection provider

- `MEDIA_INSPECTOR_URL`
- optional `MEDIA_INSPECTOR_API_KEY`
- optional `MEDIA_INSPECTOR_TIMEOUT_MS`

The inspector must retrieve the signed object URL and return the actual MIME type, byte size and validated media dimensions/duration. The server rejects mismatches.

## Required media processing provider

- `MEDIA_PROCESSOR_URL`
- optional `MEDIA_PROCESSOR_API_KEY`
- optional `MEDIA_PROCESSOR_TIMEOUT_MS`

The processor receives a signed source URL and a job type (`probe`, `scan`, `thumbnail`, `moderation`, `transcode`). For rendition jobs it must return output object keys; the worker HEAD-checks each object before recording the rendition.

## Required multimodal extraction provider

- `MULTIMODAL_EXTRACTOR_URL`
- optional `MULTIMODAL_EXTRACTOR_API_KEY`
- optional `MULTIMODAL_EXTRACTOR_TIMEOUT_MS`

The extraction worker calls the configured provider for text, image, audio, video and fusion features. Without this provider the feature job remains retryable/failed; it is not marked ready.

## Worker processes

Run the API plus the media and multimodal workers as separate long-lived processes:

- `npm run worker:media`
- `npm run worker:features`

External calls are kept outside database transactions. Jobs are leased, retried and eventually failed after bounded attempts.

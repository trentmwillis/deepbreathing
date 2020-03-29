self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith(location.origin)) {
        event.respondWith(cacheThenNetwork(event));
    }
});

/**
 * Returns a cached version of a resource while simultaneously fetching a newer
 * version from the network. Provides a fast response while updating for future
 * visits.
 */
const cacheThenNetwork = async (event) => {
    const normalizedUrl = new URL(event.request.url);
    normalizedUrl.search = '';
    normalizedUrl.hash = '';

    const resourcePromise = fetch(normalizedUrl);

    event.waitUntil(updateCacheAfter(resourcePromise, normalizedUrl));

    const cachedResource = await caches.match(normalizedUrl);
    return cachedResource || resourcePromise;
};

/**
 * Updates the cache of an asset once the request promise resolves.
 */
const updateCacheAfter = async (promise, key) => {
    const cache = await caches.open('deepbreathing');
    const value = await promise.then(response => response.clone());
    return cache.put(key, value);
};

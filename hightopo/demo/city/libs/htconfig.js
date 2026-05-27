window.htconfig = {
    Default: {
        // Resolve cross-domain issues
        crossOrigin: 'anonymous',
        convertURL: function(url) {
            var storagePrefix = 'storage';
            if (storagePrefix && url && !/^data:image/.test(url) && !/^http/.test(url) && !/^https/.test(url)) {
                url = storagePrefix + '/' + url
            }
            return url;
        }
    }
};

var path = require('path');

module.exports = {
    assets: {
        css: [
            path.resolve(__dirname, 'css/card.css'),
            path.resolve(__dirname, 'css/owls.css')
        ],
        js: [
            path.resolve(__dirname, 'module.js'),
            path.resolve(__dirname, 'routes.js'),
            path.resolve(__dirname, 'service/*.js'),
            path.resolve(__dirname, 'controllers/party.js')
        ]
    }
};

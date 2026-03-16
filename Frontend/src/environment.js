let IS_PROD = true;

const server = IS_PROD ?
    "https://zoomclone-backend-pzrh.onrender.com/" :

    "http://localhost:10000"


export default server;
const express = require('express')
const SpotifyWebApi = require('spotify-web-api-node')

const scopes = [
  'user-read-private',
  'user-top-read',
  'playlist-read-private'
]

var app = express()

var spotifyApi = new SpotifyWebApi({
  clientId: '0c8ab2e8942c482ab5e2974861cd0776',
  clientSecret: '890debe1424249aa9835b17fbf72585e',
  redirectUri: 'http://localhost:8888/callback'
})

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html')
})

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
})

app.get('/callback', (req, res) => {
  const error = req.query.error
  const code = req.query.code
  const state = req.query.state

  if (error) {
    console.error('Callback error: ', error)
    res.send(`Callback error: ${error}`)
    return
  }
  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const access_token = data.body['access_token']
      const refresh_token = data.body['refresh_token']
      const expires_in = data.body['expires_in']
      spotifyApi.setAccessToken(access_token)
      spotifyApi.setRefreshToken(refresh_token)
      console.log('access_token: ', access_token)
      console.log('refresh_token: ', refresh_token)

      console.log(`Sucessfully retreived access token. Expires in ${expires_in} s.`)
      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken()
        const access_token = data.body['access_token']

        console.log('The access token has been refreshed!')
        console.log('access_token: ', access_token)
        spotifyApi.setAccessToken(access_token)
      }, expires_in / 2 * 1000)

      res.redirect('/')
    })
    .catch(error => {
      console.error('Error getting Tokens: ', error)
    })
})

app.get('/verifyToken', async (req, res) => {
  var token = await spotifyApi.getAccessToken()
  if (token) {
    res.status(200).send({
      'verify': 1
    })
  } else {
    res.status(200).send({
      'verify': 0
    })
  }
})

app.get('/userInfo', async (req, res) => {
  var userInfo = await spotifyApi.getMe()
  res.status(200).send(userInfo.body)
})

app.get('/playlists', async (req, res) => {
  var userPlaylists = await spotifyApi.getUserPlaylists({
    limit: 40
  })
  res.status(200).send(userPlaylists.body)
})

app.get('/topArtists', async (req, res) => {
  var userTopArtists = await spotifyApi.getMyTopArtists({
    limit: 5
  })
  res.status(200).send(userTopArtists.body)
})

app.get('/topTracks', async (req, res) => {
  var userTopTracks = await spotifyApi.getMyTopTracks({
    limit: 5
  })
  res.status(200).send(userTopTracks.body)
})

app.get('/playlistTracks', async (req, res) => {
  var userPlaylist = await spotifyApi.getPlaylistTracks(req.query.id)
  res.status(200).send(userPlaylist.body)
})

console.log('Listening on 8888')
app.listen(8888)
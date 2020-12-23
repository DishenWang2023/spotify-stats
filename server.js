require('dotenv').config()
const express = require('express')
const SpotifyWebApi = require('spotify-web-api-node')

//
const scopes = [
  'user-read-private',
  'user-top-read',
  'playlist-read-private'
]

var app = express()

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
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

// get user's profile information
app.get('/userInfo', async (req, res) => {
  var userInfo = await spotifyApi.getMe()
  res.status(200).send(userInfo.body)
})

// get user's list of playlists
app.get('/playlists', async (req, res) => {
  var userPlaylists = await spotifyApi.getUserPlaylists({
    limit: 50
  })
  res.status(200).send(userPlaylists.body)
})

// get user's top artists
app.get('/topArtists', async (req, res) => {
  var userTopArtists = await spotifyApi.getMyTopArtists({
    limit: 5
  })
  res.status(200).send(userTopArtists.body)
})

// get user's top tracks
app.get('/topTracks', async (req, res) => {
  var userTopTracks = await spotifyApi.getMyTopTracks({
    limit: 5
  })
  res.status(200).send(userTopTracks.body)
})

// get playlist's tracks with full information
app.get('/playlistTracks', async (req, res) => {
  // multiplied by lim gives maximum requested tracks allowed
  const maxTracks = 3
  const lim = 100
  var userTracks = await spotifyApi.getPlaylistTracks(req.query.id, {
    limit: lim
  })
  userTracks.body.limit = maxTracks * lim
  for (var i = 1; i <= Math.min(Math.floor(userTracks.body.total / lim), maxTracks - 1); i++) {
    var newTracks = await spotifyApi.getPlaylistTracks(req.query.id, {
      offset: i * lim
    })
    userTracks.body.items = userTracks.body.items.concat(newTracks.body.items)
  }
  res.status(200).send(userTracks.body)
})

console.log('Listening on 8888')
app.listen(8888)
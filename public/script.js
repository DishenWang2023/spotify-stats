const userInfoFetch = async () => {
  fetch('/userInfo').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      d3.select('nav').select('ul')
        .append('li')
        .text('Hello ' + dataSet.display_name)
        .attr('id', 'username')
    })
    .catch(err => console.error('Error getting user Info: ', err))
}

const topArtistsFetch = async () => {
  fetch('/topArtists').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      d3.select('#loggedin')
        .append('div')
        .attr('class', 'topArtists')
        .append('h3')
        .text('Your Top 5 Artists')
      var lis = d3.select('#loggedin').select('.topArtists')
        .append('ul')
        .selectAll('li')
        .data(dataSet.items)
        .enter()
        .append('li')
        .attr('class', 'rank')
      lis.append('img')
        .attr('src', (d) => d.images[0].url)
      lis.append('p')
        .text((d, i) => (i + 1) + '. ' + d.name)
    }) // write code here
    .catch(err => console.error('Error getting user top artists: ', err))
}

const topTracksFetch = async () => {
  fetch('/topTracks').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      d3.select('#loggedin')
        .append('div')
        .attr('class', 'topTracks')
        .append('h3')
        .text('Your Top 5 Tracks')
      var lis = d3.select('#loggedin').select('.topTracks')
        .append('ul')
        .selectAll('li')
        .data(dataSet.items)
        .enter()
        .append('li')
        .attr('class', 'rank')
      lis.append('img')
        .attr('src', (d) => d.album.images[0].url)
      lis.append('p')
        .text((d, i) => (i + 1) + '. ' + d.name)
    }) // write code here
    .catch(err => console.error('Error getting user top tracks: ', err))
}

const playlistsFetch = async () => {
  fetch('/playlists').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
    }) // write code here
    .catch(err => console.error('Error getting user playlists: ', err))
}

const checkToken = async () => {
  fetch('/verifyToken').then(raw => raw.json())
    .then(check => {
      var login = document.getElementById('login')
      var loggedin = document.getElementById('loggedin')
      if (check.verify) {
        userInfoFetch()
          .then(() => topArtistsFetch())
          .then(() => topTracksFetch())
          .then(() => playlistsFetch())
          .then(() => {
            login.style.display = 'none'
            loggedin.style.display = 'block'
          })
      } else {
        login.style.display = 'block'
        loggedin.style.display = 'none'
      }
    })
    .catch(err => console.error('Error getting access token: ', err))
}

document.addEventListener('DOMContentLoaded', () => {
  checkToken()
}, false);
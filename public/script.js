var playlists = undefined;

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
  await fetch('/topArtists').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      var lis = topRankings(dataSet, 'Artists')
      lis.append('img')
        .attr('src', (d) => d.images[0].url)
      lis.append('p')
        .text((d, i) => (i + 1) + '. ' + d.name)
    })
    .catch(err => console.error('Error getting user top artists: ', err))
}

const topTracksFetch = async () => {
  await fetch('/topTracks').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      var lis = topRankings(dataSet, 'Tracks')
      lis.append('img')
        .attr('src', (d) => d.album.images[0].url)
      lis.append('p')
        .text((d, i) => (i + 1) + '. ' + d.name)
    })
    .catch(err => console.error('Error getting user top tracks: ', err))
}

const playlistsFetch = async () => {
  await fetch('/playlists').then(raw => raw.json())
    .then(dataSet => {
      console.log(dataSet)
      playlistMenu(dataSet)
      playlists = dataSet
    })
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

function topRankings(dataSet, name) {
  d3.select('#ranks')
    .append('div')
    .attr('class', 'top' + name)
    .append('h3')
    .text('Your Top 5 ' + name)
  var lis = d3.select('#ranks').select('.top' + name)
    .append('ul')
    .selectAll('li')
    .data(dataSet.items)
    .enter()
    .append('li')
    .attr('class', 'rankList')
  return lis
}

function playlistMenu(dataSet) {
  var div = d3.select('#graphs')
    .append('div')
    .attr('class', 'playlistMenu')
  div.append('h3')
    .text('Playlists')
  div.append('ul')
    .selectAll('li')
    .data(dataSet.items)
    .enter()
    .append('li')
    .attr('class', 'playlistList')
    .append('button')
    .attr('class', 'playlistButtons')
    .attr('onclick', (d, i) => 'printGraphs(' + 'this' + ',' + i + ')')
    .text((d) => d.name)
  playlists = dataSet
}

function printGraphs(ele, id) {
  durationPlaylistLolipop(playlists.items[id])
}

function artistsPlaylistPie(data) {

}

const durationPlaylistLolipop = async (playlist) => {
  await fetch('/playlistTracks?id=' + playlist.id).then(raw => raw.json())
    .then(tracks => {
      d3.select('#graphs').select('.lolipopChart').remove()
      tracks = tracks.items
      const margin = {
          top: 20,
          right: 10,
          bottom: 120,
          left: 40
        },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom
      // svg object
      const svg = d3.select('#graphs')
        .append('div')
        .attr('class', 'lolipopChart')
        .append('h3')
        .text('Track duration (sec)')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      // x axis
      var x = d3.scaleBand()
        .range([0, width])
        .domain(tracks.map((d) => d.track.name))
        .padding(1);
      svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .text((t) => {
          if (tracks.length > 50) {
            return ''
          } else if (t.length > 20) {
            return t.slice(0, 20) + '...'
          } else {
            return t
          }
        })
        .attr('transform', 'translate(-10, 0) rotate(-45)')
        .style('text-anchor', 'end')
      // y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(tracks, (d) => d.track.duration_ms / 1000)])
        .range([height, 0])
      svg.append('g')
        .call(d3.axisLeft(y))
      // lines
      svg.selectAll('myline')
        .data(tracks)
        .enter()
        .append('line')
        .attr('x1', (d) => x(d.track.name))
        .attr('x2', (d) => x(d.track.name))
        .attr('y1', (d) => y(d.track.duration_ms / 1000))
        .attr('y2', y(0))
        .attr('stroke', 'grey')
      svg.selectAll('mycircle')
        .data(tracks)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.track.name))
        .attr('cy', (d) => y(d.track.duration_ms / 1000))
        .attr('r', '3')
        .style('fill', '#1DB954')
        .attr('stroke', 'black')
        .append('title')
        .text((d) => d.track.name + ', ' + d.track.duration_ms / 1000 + ' sec')
    })
}

document.addEventListener('DOMContentLoaded', () => {
  checkToken()
}, false);
var playlists = undefined;

const userInfoFetch = async () => {
  fetch('/userInfo').then(raw => raw.json())
    .then(dataSet => {
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

// render list of top rankings
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

// render playlist's menu
function playlistMenu(dataSet) {
  var ps = ''
  if (dataSet.total >= dataSet.limit) {
    ps = ' (first ' + dataSet.limit + ' playlists)'
  }
  var div = d3.select('#graphs')
    .append('div')
    .attr('class', 'playlistMenu')
  div.append('h3')
    .text('Playlists' + ps)
  div.append('ul')
    .selectAll('li')
    .data(dataSet.items)
    .enter()
    .append('li')
    .attr('class', 'playlistList')
    .append('button')
    .attr('class', 'playlistButtons')
    .attr('onclick', (d, i) => 'printGraphs(' + i + ',\'' + d.id + '\')')
    .text((d) => d.name)
  playlists = dataSet
}

const printGraphs = async (i, id) => {
  await fetch('/playlistTracks?id=' + id).then(raw => raw.json())
    .then(tracks => {
      console.log(tracks)
      playlistTitle(i, tracks)
      popularityBar(tracks.items)
      artistsTree(tracks.items)
      durationLolipop(tracks.items)
    })
}

function playlistTitle(i, tracks) {
  d3.select('#playlistTitle').remove()
  d3.select('#graphs')
    .append('div')
    .attr('id', 'playlistTitle')
    .append('h3')
    .text(playlists.items[i].name)
  var ps = ''
  if (tracks.total >= tracks.limit) {
    d3.select('#playlistTitle')
      .append('p')
      .text(' (first ' + tracks.limit + ' tracks)')
  }
}

// render bar chart
function popularityBar(tracks) {
  d3.select('#barChart').remove()
  const margin = {
      top: 10,
      right: 10,
      bottom: 120,
      left: 40
    },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom
  d3.select('#graphs')
    .append('div')
    .attr('id', 'barChart')
    .append('h3').text('Global Song Popularity')
  // svg object
  const svg = d3.select('#barChart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  // x axis
  var x = d3.scaleBand()
    .domain(tracks.map((d) => d.track.name))
    .range([0, width])
    .padding(0.2)
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .text((t, i) => {
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
    .domain([0, 100])
    .range([height, 0])
  svg.append('g')
    .call(d3.axisLeft(y))
  // bars
  svg.selectAll('mybar')
    .data(tracks)
    .enter()
    .append('rect')
    .attr('x', (d) => x(d.track.name))
    .attr('width', x.bandwidth())
    .attr('fill', (d) => {
      var pop = d.track.popularity
      return ((pop == 0) ? '#1a1a1a' : '#4fe383')
    })
    .on('mouseover', mouseoverBar)
    .on('mouseout', mouseoutBar)
    // no bar at beginning
    .attr('height', height - y(0))
    .attr('y', y(0))
    .append('title')
    .text((d) => d.track.name + ', ' + d.track.popularity)
  svg.selectAll('rect')
    .transition()
    .duration(800)
    .attr('y', (d) => {
      var pop = d.track.popularity
      return ((pop == 0) ? y(100) : y(pop))
    })
    .attr('height', (d) => {
      var pop = d.track.popularity
      return ((pop == 0) ? (height - y(100)) : (height - y(pop)))
    })
    .delay((d, i) => (i * 60))
}

// render treemap
function artistsTree(tracks) {
  d3.select('#treemap').remove()
  const margin = {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom

  var artistsDict = []
  var artistsDictIndex = {}

  for (var i = 0; i < tracks.length; i++) {
    for (var j = 0; j < tracks[i].track.artists.length; j++) {
      const a = tracks[i].track.artists[j].name
      if (a in artistsDictIndex) {
        artistsDict[artistsDictIndex[a]].value += 1
      } else {
        artistsDictIndex[a] = artistsDict.length
        artistsDict.push({
          name: a,
          value: 1
        })
      }
    }
  }

  // create the treemap root in json format
  var root = d3.hierarchy({
      children: artistsDict
    })
    .sum((d) => d.value)
    .sort(function(a, b) {
      return b.height - a.height || b.value - a.value;
    })
  d3.select('#graphs')
    .append('div')
    .attr('id', 'treemap')
    .append('h3').text('Featured Artists')
  // svg object
  const svg = d3.select('#treemap')
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");
  // computes element position
  d3.treemap()
    .size([width, height])
    .padding(2)
    (root)
  const leaf = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
  // add rectangles
  leaf.append('rect')
    .attr('id', (d, i) => 'treemap.' + i)
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => d.y1 - d.y0)
    .attr('stroke', 'white')
    .attr('fill', (d) => {
      if (d.data.value >= 15) {
        return 'rgb(' + 29 + ',' + 155 + ',' + 84 + ')'
      } else {
        return 'rgb(' + (149 - d.data.value * 8) + ',' + (185 - d.data.value * 2) + ',' + (204 - d.data.value * 8) + ')'
      }
    })
    .on('mouseover', mouseoverTree)
    .on('mouseout', mouseoutTree)
    .append('title')
    .text((d) => {
      if (d.data.value == 1) {
        var s = ''
      } else {
        var s = 's'
      }
      return d.data.value + ' track' + s + ' featured ' + d.data.name
    })

  leaf.append("clipPath")
    .attr("id", (d, i) => "clip-" + 'treemap.' + i)
    .append("use")
    .attr("xlink:href", (d, i) => "#" + 'treemap.' + i)

  // add text labels
  leaf.append('text')
    .attr("clip-path", (d, i) => "url(#clip-" + 'treemap.' + i + ")")
    .selectAll("tspan")
    .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(d3.format(',d')(d.value)))
    .join("tspan")
    .attr("x", 3)
    .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
    .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
    .text(d => d)
    .attr('font-size', '10px')
    .attr('fill', 'white')
}

// render lolipop chart
function durationLolipop(tracks) {
  d3.select('#lolipopChart').remove()
  const margin = {
      top: 20,
      right: 10,
      bottom: 120,
      left: 40
    },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom

  d3.select('#graphs')
    .append('div')
    .attr('id', 'lolipopChart')
    .append('h3').text('Song Duration (sec)')
  // svg object
  const svg = d3.select('#lolipopChart')
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
  // circles
  svg.selectAll('mycircle')
    .data(tracks)
    .enter()
    .append('circle')
    .attr('cx', (d) => x(d.track.name))
    .attr('cy', (d) => y(d.track.duration_ms / 1000))
    .attr('r', '4')
    .attr('fill', '#1DB954')
    .attr('stroke', 'black')
    .on('mouseover', mouseoverLolipop)
    .on('mouseout', mouseoutLolipop)
    .append('title')
    .text((d) => d.track.name + ', ' + d.track.duration_ms / 1000 + ' sec')
}

function mouseoverBar(_, d, i) {
  var pop = d.track.popularity
  if (pop == 0) {
    d3.select(this).attr('stroke', '#ff9999')
  } else {
    d3.select(this).attr('fill', '#ff9999')
  }
}

function mouseoutBar(_, d, i) {
  var pop = d.track.popularity
  if (pop == 0) {
    d3.select(this).attr('stroke', 'none')
  } else {
    d3.select(this).attr('fill', '#4fe383')
  }
}

function mouseoverTree() {
  d3.select(this).attr('fill', (d) => {
    if (d.data.value >= 15) {
      return 'rgb(' + 255 + ',' + 38 + ',' + 38 + ')'
    } else {
      return 'rgb(' + 255 + ',' + (188 - d.data.value * 8) + ',' + (188 - d.data.value * 8) + ')'
    }
  })
}

function mouseoutTree() {
  d3.select(this).attr('fill', (d) => {
    if (d.data.value >= 15) {
      return 'rgb(' + 29 + ',' + 185 + ',' + 84 + ')'
    } else {
      return 'rgb(' + (149 - d.data.value * 8) + ',' + (185 - d.data.value * 2) + ',' + (204 - d.data.value * 8) + ')'
    }
  })
}

function mouseoverLolipop() {
  d3.select(this).attr('fill', '#ff9999')
}

function mouseoutLolipop() {
  d3.select(this).attr('fill', '#1DB954')
}

document.addEventListener('DOMContentLoaded', () => {
  checkToken()
}, false)
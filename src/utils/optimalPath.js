const PriorityQueue = require('javascript-priority-queue').default

export const getAmountOut = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn * 997

  return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)
}

export const getOptimalPaths = ({ graph, from, amount, to, maxHop }) => {

  const nodes = new PriorityQueue('min')
  const distances = {}
  const previous = {}

  var hop = 0
  var path = []
  var smallest

  // Init distances table and priority queue
  const vertices = Object.keys(graph)
  vertices.forEach((vertex) => {

    if (vertex == from) {
      distances[vertex] = 0
      nodes.enqueue(vertex, 0)
    } else {
      distances[vertex] = Infinity
      nodes.enqueue(vertex, Infinity)
    }
    previous[vertex] = null
  })

  while (nodes.size()) {
    smallest = String(nodes.dequeue())

    if (smallest == to) {
      while (previous[smallest]) {
        path.push(smallest)
        smallest = previous[smallest]
      }
      break
    }


    if (smallest || distances[smallest] !== Infinity) {
      for (let neighbor in graph[smallest]) {

        // find neighboring node
        let nextNode = graph[smallest][neighbor]

        // calculate new distance to neighboring node
        let candidate = distances[smallest] + nextNode.w + 0.3
        let neighborValue = nextNode.i

        if (candidate < distances[neighborValue]) {
          // updating new smallest distance to neighbor
          distances[neighborValue] = candidate
          // updating previous - How we got to neighbor
          previous[neighborValue] = smallest
          // enqueue PQ with new priority
          nodes.enqueue(neighborValue, candidate)
        }
      }
    }
  }

  return path.concat(smallest).reverse()
}

export const makeGraph = (recentPoolInfo) => {

  const weightedAdjacenyList = recentPoolInfo.reduce((acc, cur) => {

    const inputDollar = 1000
    // Price impact
    const weight = (inputDollar / (cur.poolVolume + inputDollar)) * 100 * 2

    // Remove meaningless paths
    // if (weight > 10) {
    //   return acc
    // }

    acc[cur.tokenA] = [
      ...(acc[cur.tokenA] || []),
      { i: cur.tokenB, w: weight },
    ]
    // Bi-directional
    acc[cur.tokenB] = [
      ...(acc[cur.tokenB] || []),
      { i: cur.tokenA, w: weight }
    ]

    return acc
  }, {})

  return weightedAdjacenyList
}

export const calcBestPathToKLAY = (recentPoolInfo, _tokens) => {
  const graph = makeGraph(recentPoolInfo)

  const tokens = Object.values(_tokens)
  const singleTokensByAddress = Object.entries(_tokens).reduce((acc, [symbol, { address }]) => {
    acc[address] = true
    return acc
  }, {})

  const bestpath = []

  for (var i = 0; i < tokens.length; i++) {

    const fromToken = tokens[i]
    const toToken = _tokens.KLAY

    const goContinue =
      (!singleTokensByAddress[fromToken.address] || !singleTokensByAddress[toToken.address]) ||
      (fromToken.address === toToken.address)

    if (!goContinue) {
      const optimalPath = getOptimalPaths({
        graph,
        from: fromToken.address,
        to: toToken.address,
      })

      bestpath.push(optimalPath)
    }
  }

  return bestpath
}
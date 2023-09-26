import numpy as np

class DijkstraTile:

    def __init__(self, location: tuple[int], path: list[tuple], cost: int):
        self.location = location
        self.path = path
        self.cost = cost

    def adjacent(self):
        for inx in range(len(self.location)):
            adj = list(self.location)
            adj[inx] += 1
            yield tuple(adj), inx
            adj[inx] -= 2 # ^= adj[inx]-1 of the original list
            yield tuple(adj), inx

class DijkstraGrid:

    def __init__(self, grid: np.ndarray, cost: tuple[int]):
        self.grid = grid
        self.cost = cost
        self.shape = grid.shape

    
    def pathfind(self, begin: tuple, end: tuple):
        edges: set[DijkstraTile] = set([DijkstraTile(begin, [], 0)])
        visited = {begin : DijkstraTile(begin, [], 0)}

        # needs to be rewritten as it doesn't fucking work lmao
        while end not in visited:
            next_edges = {}
            for tile in edges:
                for adj, dir in tile.adjacent():
                    if not self.contains(adj):
                        continue
                    if self.grid[adj] == 1:
                        continue
                    next = [adj, tile.path + [adj], tile.cost + self.cost[dir]]
                    if adj == end:
                        return next[1:]
                    if adj not in visited.keys():
                        next_edges[adj] = DijkstraTile(*next)
                visited[tile.location] = tile
    
    def contains(self, loc: tuple):
        for sDim, lDim in zip(self.shape, loc):
            if lDim >= sDim or lDim < 0: 
                return False
        return True

def convMaze(maze: list) -> np.ndarray:
    arr = [[1 if char == "#" else 0 for char in row] for row in maze]
    return np.array(arr)

def importMaze(filename: str) -> DijkstraGrid:
    with open(filename, "r") as f:
        data = f.read().split("\n")
    h, w = map(int, data[0].split())
    return DijkstraGrid(
        np.array([
            convMaze(data[1:h+1]),
            convMaze(data[h+2:2*h+2])
        ]),
        (3,1,1)
    )

print(importMaze("dwarfen-fortress/files/zauberschule0.txt").pathfind((1,1,1),(12,1,12)))
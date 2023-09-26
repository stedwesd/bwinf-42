import numpy as np

class DijkstraTile:

    def __init__(self, location: tuple[int], path: list[tuple], cost: int, dim: tuple[int]):
        self.location = location
        self.path = path
        self.cost = cost
        self.dim = dim

    def adjacent(self):
        for inx in range(len(self.location)):
            adj = list(self.location)
            adj[inx] += 1
            if self.dim[inx] > adj[inx]: yield tuple(adj), inx
            adj[inx] -= 2 # ^= adj[inx]-1 of the original list
            if adj[inx] >= 0: yield tuple(adj), inx
    
    def __hash__(self):
        return self.location.__hash__()
    
    def __eq__(self, other):
        if isinstance(other, DijkstraTile):
            return self.location == other.location
        return self.location == other

class DijkstraGrid:

    def __init__(self, grid: np.ndarray, cost: tuple[int]):
        self.grid = grid
        self.cost = cost
        self.shape = grid.shape

    def pathfind(self, begin: tuple, end: tuple):
        edges: set[DijkstraTile] = set([DijkstraTile(begin, [begin], 0, self.shape)])
        visited: set[tuple[int]] = set()

        min_path = 0
        #while end not in visited:
        while True:
            #print(min_path,visited)
            nxt_edges: set[DijkstraTile] = set()
            for tile in edges:
                if tile.cost > min_path:
                    nxt_edges.add(tile)
                    continue
                for adj, dir in tile.adjacent():
                    if self.grid[adj] == 1:
                        continue
                    if adj in visited:
                        continue
                    nxt_tile = DijkstraTile(adj, tile.path + [adj], tile.cost + self.cost[dir], self.shape)
                    if adj == end:
                        return nxt_tile.path, nxt_tile.cost
                    nxt_edges.add(nxt_tile)
            edges = nxt_edges.copy()
            visited = visited.union((nxt.location for nxt in nxt_edges))
            min_path += 1


def convMaze(maze: list) -> np.ndarray:
    arr = [[1 if char == "#" else 2 if char == "A" else 3 if char == "B" else 0 for char in row] for row in maze]
    return np.array(arr)

def importMaze(filename: str) -> DijkstraGrid:
    with open(filename, "r") as f:
        data = f.read().split("\n")
    h, w = map(int, data[0].split())
    arr = np.array([
            convMaze(data[1:h+1]),
            convMaze(data[h+2:2*h+2])
    ])
    return DijkstraGrid(
        arr,
        (3,1,1)
    )

def getStartPoints(arr: np.ndarray):
    start, end = None, None
    for iny, level in enumerate(arr):
        for inz, row in enumerate(level):
            for inx, id in enumerate(row):
                if id == 2:
                    start = (iny, inz, inx)
                elif id == 3:
                    end = (iny, inz, inx)
    if not (start and end):
        raise Exception("any of start,end wasnt found")
    return start, end

def visualizePath(filename):
    chars = {
        0 : ".",
        1 : "#",
        2 : "A",
        3 : "B",
        5 : "!",
        6 : "<",
        7 : "^",
        8 : ">",
        9 : "v"
    }
    maze = importMaze(filename)
    start, end = getStartPoints(maze.grid)
    path, cost = maze.pathfind(start, end)
    print(path)
    grid = maze.grid
    for inx, cur in enumerate(path[:-1]):
        nxt = path[inx+1]
        dx, dz = nxt[2] - cur[2], nxt[1] - cur[1]

        grid[cur] = 5 if nxt[0] != cur[0] else (
            6 if dx == -1 else
            8 if dx ==  1 else
            7 if dz == -1 else 9
        )
    
    string = ""
    for iny, level in enumerate(grid):
        for inz, row in enumerate(level):
            for inx, char in enumerate(row):
                string += chars[char]
            string += "\n"
        string += "\n"
    return string

if __name__ == "__main__":
    print(visualizePath("dwarfen-fortress/files/zauberschule0.txt"))
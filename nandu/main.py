from itertools import product

gates = {
    "WW" : lambda a, b: (not (a and b), not (a and b)),
    "BB" : lambda a, b: (a, b),
    "Rr" : lambda a, b: (not a, not a),
    "rR" : lambda a, b: (not b, not b),
}

def evalRow(row: list[str], inputs: list[bool]) -> list[bool]:
    lst = "X"
    skipNext = True
    for inx , cur in enumerate(row):
        if cur+lst in gates.keys() and not skipNext:
            inputs[inx], inputs[inx - 1] = gates[cur+lst](inputs[inx], inputs[inx - 1])
            skipNext = True
        else:
            skipNext = False
        lst = cur
    return inputs

def evalRows(rows: list[list[str]], inputs: list[bool]) -> list[bool]:
    for row in rows:
        inputs = evalRow(row, inputs)
    return inputs

def getIndexesIncluding(row: list[str], char: str) -> list[int]:
    inxs = []
    for inx, cur in enumerate(row):
        if char in cur:
            inxs.append(inx)
    return inxs

def generateTable(string: str):

    nandu = [*map(lambda row: row.rstrip().split(), string.split("\n"))]
    width, height = int(nandu[0][0]), int(nandu[0][1])

    inIndexes = getIndexesIncluding(nandu[1],"Q")
    outIndexes = getIndexesIncluding(nandu[-1], "L")
    
    rows = nandu[1:-1]

    res = {}
    for permutation in product([False, True], repeat=len(inIndexes)):
        inputs = [inx in inIndexes and permutation[inIndexes.index(inx)] for inx in range(width)]
        result = evalRows(rows, inputs)
        res[permutation] = [result[inx] for inx in outIndexes]
    
    return res

if __name__ == "__main__":
    
    def conv(k: list[bool] | tuple[bool]) -> str:
        return "".join("1" if val else "0" for val in k)
    
    for i in range(5):
        with open(f"files/nandu{i+1}.txt","r") as f:
            data = f.read()
        print(f"\n\nNANDU: {i+1}  \n{data}\n\nRESULTS:")
        print(*[f"{conv(k)} : {conv(v)}" for k, v in generateTable(data).items()],sep="\n")
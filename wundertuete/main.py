
def importFile(filename: str):
    with open(filename, "r") as f:
        data = f.read().split("\n")

    # Anzahl an Wundertueten 
    n = int(data[0])
    # Anzahl der Spielesorten
    k = int(data[1])
    # Anzahl der Spiele pro Spielesorte
    sorts = []
    for i in range(k):
        sorts.append(int(data[i+2]))
    
    return str(getWundertueten(n,k,sorts))


def getWundertueten(n,k,sorts):
    # Erstellt eine Liste an Wundertueten, die jeweils die Anzahl an erhaltenen Spielen pro Spielesorte enthält
    tueten = []
    for t in range(n):
        tueten.append([])
        for i in range(k):
            tueten[t].append(0)

    # Teilt die Spiele auf die Wundertueten auf, dabei wird jede Spielesorte nacheinander durchgegangen und jede Tuete bekommt nacheinander jeweils 1 Spielzeug.
    currentTuete = 0   
    for s in range(len(sorts)):
        for i in range(sorts[s]):
            tueten[currentTuete][s]+=1
            currentTuete = (currentTuete+1)%n
    
    return tueten
    

if __name__ == "__main__":
    for i in range(6):
        res = importFile(f"files/wundertuete{i}.txt")
        with open(f"output/wundertuete{i}.txt","w") as f:
            f.write(res)
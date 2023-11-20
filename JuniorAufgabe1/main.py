def importFile(filename: str):
    with open(filename, "r") as f:
        data = f.read().split("\n")

    # Anzahl an Wundertueten 
    n = int(data[0])
    # Anzahl der Spielesorten
    k = int(data[1])
    # Anzahl der Spiele pro Spielesorte
    sorten = []
    for i in range(k):
        sorten.append(int(data[i+2]))
    
    return wundertuetenAufteilen(n,k,sorten)


def wundertuetenAufteilen(n,k,sorten):
    # Erstellt eine Liste an Wundertueten, die jeweils die Anzahl an erhaltenen Spielen pro Spielesorte enthält
    tueten = []
    for t in range(n):
        tueten.append([])
        for i in range(k):
            tueten[t].append(0)

    # Teilt die Spiele auf die Wundertueten auf, dabei wird jede Spielesorte nacheinander durchgegangen und jede Tuete bekommt nacheinander jeweils 1 Spielzeug.
    aktuelleTuete = 0   
    for s in range(len(sorten)):
        for i in range(sorten[s]):
            tueten[aktuelleTuete][s]+=1
            aktuelleTuete = (aktuelleTuete+1)%n
    
    return tueten

def schreibeOutput(tueten):
    output = ""
    for t in tueten:
        text = str(t)
        output += text[1:len(text)-1] + "\n"
    return output

if __name__ == "__main__":
    for i in range(6):
        ergebnis = schreibeOutput(importFile(f"files/wundertuete{i}.txt"))
        with open(f"output/wundertuete{i}.txt","w") as f:
            f.write(ergebnis)
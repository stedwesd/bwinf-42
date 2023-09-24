# both libaries are not within the standart python library; have to be downloaded using pip / python -m pip
from PIL import Image # pip install pillow
import numpy as np # pip install numpy

def getSecretMessage(path: str):
    im = np.array(Image.open(path))
    x, y, dx, dy = 0, 0, 0, 0
    h, w = im.shape[:2]
    msg = ""
    while not msg or dx or dy:
        char, dx, dy = im[y, x][:3]
        msg += chr(char)
        x += dx
        y += dy
        x %= w
        y %= h
    return msg


if __name__ == "__main__":
    for i in range(7):
        print(f"\n\nIMAGE: bild0{i+1}.png\n\n")
        print(getSecretMessage(f"egano/files/bild0{i+1}.png"))
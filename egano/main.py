from PIL import Image

def getSecretMessage(path: str):
    img = Image.open(path)
    x, y, dx, dy = 0, 0, 0, 0
    w, h = img.size
    msg = ""
    while not msg or dx or dy:
        char, dx, dy, _ = img.getpixel((x, y))
        msg += chr(char) # add the characters
        x, y = x + dx, y + dy # add the offsets
        x, y = x % w, y % h # wrap over the ends of the picture
    return msg


if __name__ == "__main__":
    for i in range(7):
        print(f"\n\nIMAGE: bild0{i+1}.png\n\n")
        print(getSecretMessage(f"egano/files/bild0{i+1}.png"))
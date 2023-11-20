from PIL import Image

def getSecretMessage(filename: str, output: str):
    img = Image.open(filename)
    x, y, dx, dy = 0, 0, 0, 0
    w, h = img.size
    msg = ""
    while msg!="" or dx==0 or dy==0: # while we have not reached the last pixel (with g=0 and b=0)
        char, dx, dy = img.getpixel((x, y))[:3] # we are not interested in the alpha channel
        msg += chr(char) # add the characters
        x, y = x + dx, y + dy # add the offsets
        x, y = x % w, y % h # wrap over the ends of the picture
    
    with open(output, "w",encoding="utf-8") as f:
        f.write(msg)


if __name__ == "__main__":
    for i in range(7):
        getSecretMessage(f"files/bild0{i+1}.png", f"output/bild0{i+1}.txt")
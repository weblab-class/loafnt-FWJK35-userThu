import pygame as pg
import random as rnd

pg.init()
  
bgcolor = (255,255,255)
color = (0,0,0)

  
# CREATING CANVAS
canvas_size = (500, 500)
canvas = pg.display.set_mode(canvas_size)

mazesize = 16
maze = [[[True for s in range(4)] for x in range(mazesize)] for y in range(mazesize)]
gridsize = min(canvas_size) * 0.8 / mazesize

sides = ((0, 0), (1, 0), (1, 1), (0, 1), (0, 0))
sides = [(s[0] * gridsize, s[1] * gridsize) for s in sides]
dirs = ((0, -1), (1, 0), (0, 1), (-1, 0))
print(sides)

def add(a, b):
    return (a[0] + b[0], a[1] + b[1])
corner = (canvas_size[0] * 0.1, canvas_size[1] * 0.1)

def mz(coord):
    return maze[coord[1]][coord[0]]

def inrange(coord):
    return (0 <= coord[0] < mazesize) and (0 <= coord[1] < mazesize)

rnd.seed("victoria")


count = 0

algo = 0
if algo == 0:
    visited = set()
    path = []
    current = (0, 0)
    visited.add((0, 0))

    def isfree(coord):
        for td in dirs:
            if (add(coord, td) not in visited) and inrange(add(coord, td)):
                return True
        return False
    
    def genmaze():
        global maze, visited, path, current, count
        count = 0
        maze = [[[True for s in range(4)] for x in range(mazesize)] for y in range(mazesize)]
        visited = set()
        path = []
        current = (0, 0)
        visited.add((0, 0))
        while len(visited) < mazesize ** 2:
            mazestep()
        print(count)

    def mazestep():
        global current, path, visited, count
        
        while not isfree(current):
            current = path.pop(-1)

        options = []
        for o in range(4):
            if inrange(add(current, dirs[o])) and add(current, dirs[o]) not in visited:
                options.append(o)

        count += len(options)

        travelnum = rnd.choice(options)
        traveldir = dirs[travelnum]

        newspace = add(current, traveldir)
        mz(newspace)[(travelnum - 2) % 4] = False
        mz(current)[travelnum] = False

        path.append(current)
        visited.add(newspace)
        current = newspace
        




exit = False
while not exit:




    for event in pg.event.get(): 
        if event.type == pg.QUIT: 
            exit = True

        if event.type == pg.KEYDOWN:
            if event.key == pg.K_SPACE:
                if len(visited) < mazesize ** 2:
                    mazestep()
            if event.key == pg.K_TAB:
                genmaze()


    canvas.fill(bgcolor)
    for y in range(mazesize):
        for x in range(mazesize):
            startcoord = add(corner, (x * gridsize, y * gridsize))
            for s in range(4):
                if maze[y][x][s]:
                    pg.draw.line(canvas, color, add(startcoord, sides[s]), add(startcoord, sides[s + 1]), 3)
    pg.display.update()
        
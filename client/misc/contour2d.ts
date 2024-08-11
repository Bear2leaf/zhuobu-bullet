
class Segment {
    start: number
    end: number
    direction: number
    height: number
    visited: boolean
    next: null
    prev: null
    constructor(start: number, end: number, direction: number, height: number) {
        this.start = start
        this.end = end
        this.direction = direction
        this.height = height
        this.visited = false
        this.next = null
        this.prev = null
    }
}
class Vertex {
    x: number
    y: number
    segment: Segment
    orientation: number
    constructor(x: number, y: number, segment: Segment, orientation: number) {
        this.x = x
        this.y = y
        this.segment = segment
        this.orientation = orientation
    }
}
function getParallelCountours(array: any, direction: number) {
    const n = array.shape[0]
    const m = array.shape[1]
    const contours = []
    //Scan top row
    let a = false
    let b = false
    let c = false
    let d = false
    let x0 = 0
    let i = 0, j = 0
    for (j = 0; j < m; ++j) {
        b = !!array.get(0, j)
        if (b === a) {
            continue
        }
        if (a) {
            contours.push(new Segment(x0, j, direction, 0))
        }
        if (b) {
            x0 = j
        }
        a = b
    }
    if (a) {
        contours.push(new Segment(x0, j, direction, 0))
    }
    //Scan center
    for (i = 1; i < n; ++i) {
        a = false
        b = false
        x0 = 0
        for (j = 0; j < m; ++j) {
            c = !!array.get(i - 1, j)
            d = !!array.get(i, j)
            if (c === a && d === b) {
                continue
            }
            if (a !== b) {
                if (a) {
                    contours.push(new Segment(j, x0, direction, i))
                } else {
                    contours.push(new Segment(x0, j, direction, i))
                }
            }
            if (c !== d) {
                x0 = j
            }
            a = c
            b = d
        }
        if (a !== b) {
            if (a) {
                contours.push(new Segment(j, x0, direction, i))
            } else {
                contours.push(new Segment(x0, j, direction, i))
            }
        }
    }
    //Scan bottom row
    a = false
    x0 = 0
    for (j = 0; j < m; ++j) {
        b = !!array.get(n - 1, j)
        if (b === a) {
            continue
        }
        if (a) {
            contours.push(new Segment(j, x0, direction, n))
        }
        if (b) {
            x0 = j
        }
        a = b
    }
    if (a) {
        contours.push(new Segment(j, x0, direction, n))
    }
    return contours
}
function getVertices(contours: Segment[]) {
    const vertices = new Array(contours.length * 2)
    for (let i = 0; i < contours.length; ++i) {
        const h = contours[i]
        if (h.direction === 0) {
            vertices[2 * i] = new Vertex(h.start, h.height, h, 0)
            vertices[2 * i + 1] = new Vertex(h.end, h.height, h, 1)
        } else {
            vertices[2 * i] = new Vertex(h.height, h.start, h, 0)
            vertices[2 * i + 1] = new Vertex(h.height, h.end, h, 1)
        }
    }
    return vertices
}
function walk(v: Segment | null, clockwise: boolean) {
    const result = []
    while (v && !v.visited) {
        v.visited = true
        if (v.direction) {
            result.push([v.height, v.end])
        } else {
            result.push([v.start, v.height])
        }
        if (clockwise) {
            v = v.next
        } else {
            v = v.prev
        }
    }
    return result
}
function compareVertex(a: Vertex, b: Vertex) {
    let d = a.x - b.x
    if (d) {
        return d
    }
    d = a.y - b.y
    if (d) {
        return d
    }
    return a.orientation - b.orientation
}

export function getContours(array: any, clockwise: boolean) {

    clockwise = !!clockwise

    //First extract horizontal contours and vertices
    const hcontours = getParallelCountours(array, 0)
    const hvertices = getVertices(hcontours)
    hvertices.sort(compareVertex)

    //Extract vertical contours and vertices
    const vcontours = getParallelCountours(array.transpose(1, 0), 1)
    const vvertices = getVertices(vcontours)
    vvertices.sort(compareVertex)

    //Glue horizontal and vertical vertices together
    const nv = hvertices.length
    for (let i = 0; i < nv; ++i) {
        const h = hvertices[i]
        const v = vvertices[i]
        if (h.orientation) {
            h.segment.next = v.segment
            v.segment.prev = h.segment
        } else {
            h.segment.prev = v.segment
            v.segment.next = h.segment
        }
    }

    //Unwrap loops
    const loops = []
    for (let i = 0; i < hcontours.length; ++i) {
        const h = hcontours[i]
        if (!h.visited) {
            loops.push(walk(h, clockwise))
        }
    }

    //Return
    return loops
}
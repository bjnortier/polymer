"use strict";

var Vec3 = require('vecks').Vec3;

// From http://www.blackpawn.com/texts/pointinpoly/default.html
function isSameSide(p1,p2,a,b)  {
  var cp1 = b.sub(a).cross(p1.sub(a));
  var cp2 = b.sub(a).cross(p2.sub(a));
  return cp1.dot(cp2) >= 0;
}

function isPointInTriangle(point, triangle) {
  return isSameSide(point, triangle[0], triangle[1], triangle[2]) &&
         isSameSide(point, triangle[1], triangle[2], triangle[0]) &&
         isSameSide(point, triangle[2], triangle[0], triangle[1]);
}

// Find the right-handed normal of the polygon,
// i.e. the anti-clockwise normal as determnined 
// by the ordering of the coordinates. 
// The algorithm works by selecting a test normal, then
// determining the concavity/convexity of each vertex
// (in relation to the test normal)
// If the positve angles outnumber the negative ones,
// the test normal is correct, otherwise it is reversed.
function getRightHandPolygonNormal(polygon) {
  if (polygon.length <= 2) {
    return undefined;
  }

  // Pick a normal by findind the first cross product that's valid
  // (and ignore subsequent straight edges)
  var ab, bc, testNormal;
  for (var i = 0; i < polygon.length - 2; ++i) {
    ab = polygon[i+1].sub(polygon[i]);
    bc = polygon[i+2].sub(polygon[i+1]);
    if (ab.cross(bc).length() > 0) {
      testNormal = ab.cross(bc).normalize();
      break;
    }
  }

  if (!testNormal) {
    return undefined;
  }

  var positives = 0;
  var negatives = 0;
  for (i = 0; i < polygon.length; ++i) {
    var a = polygon[i];
    var b = polygon[(i + 1) % polygon.length];
    var c = polygon[(i + 2) % polygon.length];
    ab = b.sub(a);
    bc = c.sub(b);

    // Clamp to support values such as 1.00000002
    var crossABC = ab.cross(bc).length()/ab.length()/bc.length();
    var dotABC = ab.dot(bc)/ab.length()/bc.length();
    var alpha = Math.asin(Math.min(Math.max(crossABC, -1), 1))/Math.PI*180;
    var beta = Math.asin(Math.min(Math.max(dotABC, -1), 1))/Math.PI*180;
    var n = ab.cross(bc).normalize();

    var theta;
    if (n.dot(testNormal) > 0) {
      if (beta > 0) {
        theta = alpha;
      } else {
        theta = 180 - alpha;
      }
    } else {
      if (beta > 0) {
        theta = -alpha;
      } else {
        theta = -(180 - alpha);
      }
    }

    if (theta > 0) { 
      positives += theta;
    } else {
      negatives += theta;
    }
  }
  if (positives > -negatives) {
    return testNormal;
  } else {
    return testNormal.negate();
  }
}

// The vertex is convex if the cross vector is in the same
// direction as the sum of the crosses
function isConvex(i, polygon, polygonNormal) {
  var from = polygon[i].sub(polygon[(i - 1 + polygon.length) % polygon.length]);
  var to = polygon[(i + 1) % polygon.length].sub(polygon[i]);
  return from.cross(to).dot(polygonNormal) >= 0;
}

// http://en.wikipedia.org/wiki/Polygon_triangulation
// Iteratively remove ears from polygon. Simple algorithm but
// is O(n^2). Faster but more complex algorithm based on
// monotone polygons is available here: http://www.cs.unc.edu/~dm/CODE/GEM/chapter.html
module.exports = function(points) {

  if (points.length < 3) {
    return [];
  }

  var polygon = points.map(function(p) {
    return new Vec3(p.x, p.y, p.z);
  });

  var polygonNormal = getRightHandPolygonNormal(polygon);

  // Get the index of the vertices on either side of the index
  var triangleAtIndex = function(poly, index) {
    return [
      poly[(index + poly.length - 1) % poly.length],
      poly[index],
      poly[(index + 1) % poly.length],
    ];
  };

  var triangulation = [];
  var sanity = polygon.length;
  do {

    // With the remaining polygon:
    // 1. Check a triangle
    // 2. If none of the other points are inside it, it's an ear
    //    2.1 Remove the ear

    if (!polygonNormal) {
      return [];
    }

    for (var i = 0; i < polygon.length; ++i) {
      if (!isConvex(i, polygon, polygonNormal)) {
        continue;
      }

      var triangle = triangleAtIndex(polygon, i);
      var isEar = true;
      for (var j = 0 ; j < polygon.length; ++j) {
        if ((j !== i) &&
          (j !== ((i+1) % polygon.length)) &&
          (j !== ((i+polygon.length-1) % polygon.length))) {


          if (isPointInTriangle(polygon[j], triangle)) {
            isEar = false;
            break;
          }
        }
      }

      if (isEar) {
        triangulation.push(triangle);
        polygon.splice(i, 1);
      }
    }

    --sanity;

  } while((polygon.length > 2) && (sanity >= 0));

  return triangulation;
};


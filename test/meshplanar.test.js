var chai = require('chai');
var assert = chai.assert;

var Vec3 = require('vecks').Vec3;
var meshPlanar = require('..').meshPlanar;

assert.v3Equal = function(actual, expected) {
  assert.deepEqual({x: actual.x, y: actual.y, z: actual.z}, expected);
};

assert.triangleEqual = function(triangle, expected) {
  assert.equal(triangle.length, 3);
  assert.v3Equal(triangle[0], expected[0]);
  assert.v3Equal(triangle[1], expected[1]);
  assert.v3Equal(triangle[2], expected[2]);
};

describe('Mesh Planar', function() {

  it('can mesh a polygon in the XY plane', function() {

    var polygon = [new Vec3(0,0,0), new Vec3(1,0,0), new Vec3(1,1,0), new Vec3(0,1,0)];

    var mesh = meshPlanar(polygon);

    assert.equal(mesh.length, 2);
    assert.triangleEqual(mesh[0], [
      {x: 0, y: 1, z: 0},
      {x: 0, y: 0, z: 0},
      {x: 1, y: 0, z: 0},
    ]);
    assert.triangleEqual(mesh[1], [
      {x: 0, y: 1, z: 0},
      {x: 1, y: 0, z: 0},
      {x: 1, y: 1, z: 0},
    ]);

  });

  it('can mesh a concave polygon in the XY plane', function() {

    var polygon = [
      new Vec3(0,0,0),
      new Vec3(1,0,0),
      new Vec3(0.5,0.5,0),
      new Vec3(1,1,0),
      new Vec3(0,1,0),
    ];

    var mesh = meshPlanar(polygon);
    assert.equal(mesh.length, 3);

    assert.triangleEqual(mesh[0], [
      {x: 0, y: 0, z: 0},
      {x: 1, y: 0, z: 0},
      {x: 0.5, y: 0.5, z: 0},
    ]);
    assert.triangleEqual(mesh[1], [
      {x: 0, y: 1, z: 0},
      {x: 0, y: 0, z: 0},
      {x: 0.5, y: 0.5, z: 0},
    ]);
    assert.triangleEqual(mesh[2], [
      {x: 0, y: 1, z: 0},
      {x: 0.5, y: 0.5, z: 0},
      {x: 1, y: 1, z: 0},
    ]);

  });

});

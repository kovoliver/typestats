import Matrix from '../../core/math/Matrix';

console.log('=== 1. Basic Matrix Operations & Properties ===');

// Create a 3x3 square matrix
const matA = new Matrix([
  [4, 1, -2],
  [1, 2, 0],
  [-2, 0, 5]
]);

console.log('Matrix A Dimensions:', `${matA.rows}x${matA.cols}`);
console.log('Is Square:', matA.isSquare);
console.log('Is Symmetric:', matA.isSymmetric);
console.log('Element at [0, 0]:', matA.getElement(0, 0));
console.log('Transposed A:\n', matA.transposed.values);
console.log('Determinant of A:', matA.determinant);


console.log('\n=== 2. Matrix Inversion ===');

const invA = matA.inverse();
console.log('Inverse of A:\n', invA.values);


console.log('\n=== 3. Eigen Decomposition (Symmetric Matrix) ===');

// Jacobi eigenvalue algorithm on symmetric Matrix A
const eigenResult = matA.eigen();
console.log('Eigenvalues:', eigenResult.values);
console.log('Eigenvectors Matrix:\n', eigenResult.vectors.values);


console.log('\n=== 4. Linear System Solver (A * x = b) ===');

// System of linear equations:
//  4x +  y - 2z = 7
//   x + 2y      = 4
// -2x      + 5z = 3
const b = [7, 4, 3];
const solutionX = matA.solve(b);

console.log('Vector b:', b);
console.log('Solution Vector x [x, y, z]:', solutionX);
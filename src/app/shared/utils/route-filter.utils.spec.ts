import { Route, createRoute } from '../../data-contracts/route.model';
import { filterRoutes, parseGradeSearch } from './route-filter.utils';

describe('Route Filter Utils', () => {
  const mockRoutes: Route[] = [
    createRoute({ id: 1, name: 'Crimpy Overhang', forward_grade: 4, reverse_grade: 3 }),
    createRoute({ id: 2, name: 'Slab Master', forward_grade: 2, reverse_grade: 2 }),
    createRoute({ id: 3, name: 'The Beast', forward_grade: 7, reverse_grade: 6 }),
    createRoute({ id: 4, name: 'V5 Crusher', forward_grade: 5, reverse_grade: 4 }),
    createRoute({ id: 5, name: 'Easy Warmup', forward_grade: 0, reverse_grade: 0 }),
  ];

  describe('parseGradeSearch', () => {
    it('should parse lowercase "v5" to grade 5', () => {
      expect(parseGradeSearch('v5')).toBe(5);
    });

    it('should parse uppercase "V5" to grade 5', () => {
      expect(parseGradeSearch('V5')).toBe(5);
    });

    it('should parse "v0" to grade 0', () => {
      expect(parseGradeSearch('v0')).toBe(0);
    });

    it('should parse "v12" to grade 12', () => {
      expect(parseGradeSearch('v12')).toBe(12);
    });

    it('should return null for non-grade searches', () => {
      expect(parseGradeSearch('crimpy')).toBeNull();
      expect(parseGradeSearch('v')).toBeNull();
      expect(parseGradeSearch('vhard')).toBeNull();
      expect(parseGradeSearch('')).toBeNull();
    });

    it('should return null for invalid grade formats', () => {
      expect(parseGradeSearch('5v')).toBeNull();
      expect(parseGradeSearch('grade5')).toBeNull();
    });
  });

  describe('filterRoutes', () => {
    it('should return all routes when search is empty', () => {
      const result = filterRoutes(mockRoutes, '');
      expect(result.length).toBe(5);
    });

    it('should return all routes when search is whitespace', () => {
      const result = filterRoutes(mockRoutes, '   ');
      expect(result.length).toBe(5);
    });

    it('should filter by route name (case insensitive)', () => {
      const result = filterRoutes(mockRoutes, 'slab');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Slab Master');
    });

    it('should filter by partial name match', () => {
      const result = filterRoutes(mockRoutes, 'the');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('The Beast');
    });

    it('should filter by forward grade when searching "v5"', () => {
      const result = filterRoutes(mockRoutes, 'v5');
      expect(result.length).toBe(1);
      expect(result[0].forward_grade).toBe(5);
    });

    it('should filter by reverse grade when searching "v6"', () => {
      const result = filterRoutes(mockRoutes, 'v6');
      expect(result.length).toBe(1);
      expect(result[0].reverse_grade).toBe(6);
    });

    it('should match both forward and reverse grades', () => {
      const result = filterRoutes(mockRoutes, 'v4');
      // Route 1: forward=4, Route 4: reverse=4
      expect(result.length).toBe(2);
    });

    it('should handle routes with "V" in their name AND grade search', () => {
      // "V5 Crusher" has "v5" in name, and forward_grade=5
      // Searching "v5" should find it (either by name or grade)
      const result = filterRoutes(mockRoutes, 'v5');
      expect(result.some(r => r.name === 'V5 Crusher')).toBe(true);
    });

    it('should return empty array when no routes match', () => {
      const result = filterRoutes(mockRoutes, 'nonexistent');
      expect(result.length).toBe(0);
    });

    it('should handle undefined route names gracefully', () => {
      const routesWithUndefined = [
        createRoute({ id: 1, forward_grade: 5 }), // name is undefined
        createRoute({ id: 2, name: 'Test Route', forward_grade: 3 }),
      ];
      const result = filterRoutes(routesWithUndefined, 'test');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Test Route');
    });

    it('should find grade 0 routes when searching "v0"', () => {
      const result = filterRoutes(mockRoutes, 'v0');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Easy Warmup');
    });
  });
});

import { Route } from '../../data-contracts/route.model';

/**
 * Parse a search string to extract a climbing grade.
 * Supports formats like "v5", "V5", "v12", etc.
 *
 * @param search - The search string
 * @returns The numeric grade, or null if not a valid grade search
 */
export function parseGradeSearch(search: string): number | null {
  if (!search || search.length < 2) {
    return null;
  }

  const trimmed = search.trim().toLowerCase();

  // Must start with 'v' followed by digits only
  if (!trimmed.startsWith('v')) {
    return null;
  }

  const gradeStr = trimmed.substring(1);

  // Must be all digits
  if (!/^\d+$/.test(gradeStr)) {
    return null;
  }

  return parseInt(gradeStr, 10);
}

/**
 * Filter routes by search term.
 *
 * Supports:
 * - Name matching (case insensitive, partial match)
 * - Grade matching (e.g., "v5" matches forward_grade=5 or reverse_grade=5)
 *
 * @param routes - Array of routes to filter
 * @param search - Search term
 * @returns Filtered routes
 */
export function filterRoutes(routes: Route[], search: string): Route[] {
  const trimmed = search.trim();

  if (!trimmed) {
    return [...routes];
  }

  const searchLower = trimmed.toLowerCase();
  const gradeSearch = parseGradeSearch(trimmed);

  return routes.filter((route) => {
    // Check name match (case insensitive)
    if (route.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Check grade match
    if (gradeSearch !== null) {
      if (route.forward_grade === gradeSearch || route.reverse_grade === gradeSearch) {
        return true;
      }
    }

    return false;
  });
}

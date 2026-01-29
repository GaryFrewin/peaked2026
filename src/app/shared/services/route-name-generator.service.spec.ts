import { RouteNameGeneratorService } from './route-name-generator.service';

describe('RouteNameGeneratorService', () => {
  let service: RouteNameGeneratorService;

  beforeEach(() => {
    service = new RouteNameGeneratorService();
  });

  it('should_generate_a_non_empty_route_name', () => {
    const result = service.generateRouteName();

    expect(result.length).toBeGreaterThan(0);
  });

  it('should_generate_different_names_on_multiple_calls', () => {
    /** Multiple calls should produce variety since names are randomly generated. */
    const names = new Set<string>();

    for (let i = 0; i < 20; i++) {
      names.add(service.generateRouteName());
    }

    expect(names.size).toBeGreaterThan(1);
  });

  it('should_generate_name_matching_expected_format', () => {
    /** Names should be multi-word strings (adjective + noun, action + noun, etc.) */
    const result = service.generateRouteName();

    expect(result.split(' ').length).toBeGreaterThanOrEqual(2);
  });
});

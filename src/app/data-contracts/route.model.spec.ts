import {
  Route,
  RouteHold,
  Style,
  createRoute,
  createRouteHold,
  cycleStartType,
  cycleEndType,
} from './route.model';

describe('Route Model', () => {
  describe('Route', () => {
    it('should create an empty route with default values', () => {
      const route = createRoute({});
      expect(route.route_holds).toEqual([]);
    });

    it('should create a route with all properties', () => {
      const route = createRoute({
        id: 1,
        name: 'Test Route',
        wallversion_id: 5,
        forward_grade: 4,
        reverse_grade: 3,
        forward_star_rating: 5,
        reverse_star_rating: 4,
        notes: 'A fun route',
      });
      expect(route.id).toBe(1);
      expect(route.name).toBe('Test Route');
      expect(route.wallversion_id).toBe(5);
      expect(route.forward_grade).toBe(4);
      expect(route.reverse_grade).toBe(3);
      expect(route.forward_star_rating).toBe(5);
      expect(route.reverse_star_rating).toBe(4);
      expect(route.notes).toBe('A fun route');
    });

    it('should preserve route_holds when provided', () => {
      const holds: RouteHold[] = [
        createRouteHold({ hold_id: 1 }),
        createRouteHold({ hold_id: 2 }),
      ];
      const route = createRoute({ route_holds: holds });
      expect(route.route_holds.length).toBe(2);
      expect(route.route_holds[0].hold_id).toBe(1);
    });

    it('should preserve styles when provided', () => {
      const styles: Style[] = [
        { id: 1, name: 'Overhang' },
        { id: 2, name: 'Slab' },
      ];
      const route = createRoute({ styles });
      expect(route.styles?.length).toBe(2);
      expect(route.styles?.[0].name).toBe('Overhang');
    });
  });

  describe('RouteHold', () => {
    it('should create a route hold with hold reference', () => {
      const routeHold = createRouteHold({
        hold_id: 123,
        forwardhandstart: true,
      });
      expect(routeHold.hold_id).toBe(123);
      expect(routeHold.forwardhandstart).toBe(true);
    });

    it('should create a route hold with all start/end flags false by default', () => {
      const routeHold = createRouteHold({});
      expect(routeHold.forwardhandstart).toBe(false);
      expect(routeHold.forwardfootstart).toBe(false);
      expect(routeHold.reversehandstart).toBe(false);
      expect(routeHold.reversefootstart).toBe(false);
    });

    describe('cycleStartType', () => {
      it('should cycle: none → forwardhandstart', () => {
        const rh = createRouteHold({});
        cycleStartType(rh);
        expect(rh.forwardhandstart).toBe(true);
        expect(rh.forwardfootstart).toBe(false);
        expect(rh.reversehandstart).toBe(false);
        expect(rh.reversefootstart).toBe(false);
      });

      it('should cycle: forwardhandstart → forwardfootstart', () => {
        const rh = createRouteHold({ forwardhandstart: true });
        cycleStartType(rh);
        expect(rh.forwardhandstart).toBe(false);
        expect(rh.forwardfootstart).toBe(true);
      });

      it('should cycle: forwardfootstart → none', () => {
        const rh = createRouteHold({ forwardfootstart: true });
        cycleStartType(rh);
        expect(rh.forwardhandstart).toBe(false);
        expect(rh.forwardfootstart).toBe(false);
        expect(rh.reversehandstart).toBe(false);
        expect(rh.reversefootstart).toBe(false);
      });

      it('should cycle: reversehandstart → forwardhandstart', () => {
        const rh = createRouteHold({ reversehandstart: true });
        cycleStartType(rh);
        expect(rh.reversehandstart).toBe(false);
        expect(rh.forwardhandstart).toBe(true);
      });

      it('should cycle: reversefootstart → forwardhandstart', () => {
        const rh = createRouteHold({ reversefootstart: true });
        cycleStartType(rh);
        expect(rh.reversefootstart).toBe(false);
        expect(rh.forwardhandstart).toBe(true);
      });
    });

    describe('cycleEndType', () => {
      it('should cycle: none → reversehandstart', () => {
        const rh = createRouteHold({});
        cycleEndType(rh);
        expect(rh.reversehandstart).toBe(true);
        expect(rh.reversefootstart).toBe(false);
        expect(rh.forwardhandstart).toBe(false);
        expect(rh.forwardfootstart).toBe(false);
      });

      it('should cycle: reversehandstart → reversefootstart', () => {
        const rh = createRouteHold({ reversehandstart: true });
        cycleEndType(rh);
        expect(rh.reversehandstart).toBe(false);
        expect(rh.reversefootstart).toBe(true);
      });

      it('should cycle: reversefootstart → none', () => {
        const rh = createRouteHold({ reversefootstart: true });
        cycleEndType(rh);
        expect(rh.reversehandstart).toBe(false);
        expect(rh.reversefootstart).toBe(false);
      });

      it('should cycle: forwardhandstart → reversehandstart', () => {
        const rh = createRouteHold({ forwardhandstart: true });
        cycleEndType(rh);
        expect(rh.forwardhandstart).toBe(false);
        expect(rh.reversehandstart).toBe(true);
      });

      it('should cycle: forwardfootstart → reversehandstart', () => {
        const rh = createRouteHold({ forwardfootstart: true });
        cycleEndType(rh);
        expect(rh.forwardfootstart).toBe(false);
        expect(rh.reversehandstart).toBe(true);
      });
    });
  });

  describe('Style', () => {
    it('should create a style with name', () => {
      const style: Style = { id: 1, name: 'Overhang' };
      expect(style.id).toBe(1);
      expect(style.name).toBe('Overhang');
    });

    it('should allow style without id', () => {
      const style: Style = { name: 'Crimp' };
      expect(style.name).toBe('Crimp');
      expect(style.id).toBeUndefined();
    });
  });
});

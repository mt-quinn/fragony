"""Regression checks for the source collision repairs used by stairs."""
import pathlib,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
from summit_planes import signed_distance
from stair_collision import clear_stairs

class StairImports(unittest.TestCase):
    def test_signed_native_planes(self):
        bounds={'midPoint':{'x':3226,'y':-336,'z':380},'halfSize':{'x':102,'y':40,'z':76}}
        self.assertEqual(signed_distance({'normal':[0,0,-1],'dist':304},bounds),-304)
        self.assertEqual(signed_distance({'normal':[1,0,0],'dist':3328},bounds),3328)
        self.assertLess(signed_distance({'normal':[-.5547001957893372,0,.8320502638816833],'dist':1466.6273193359375},bounds),0)
        self.assertEqual(signed_distance({'normal':[0,0,-1],'dist':-304},bounds),-304)

    def test_clearance_preserves_surrounding_solid(self):
        cube={'id':'solid','x':0,'z':0,'w':10,'d':10,'bottom':0,'top':10,'planes':[[1,0,0,5],[-1,0,0,5],[0,0,1,5],[0,0,-1,5],[0,1,0,10],[0,-1,0,0]]}
        clearance={'x':0,'z':0,'w':2,'d':2,'yaw':.37,'bottom':2,'top':8,'blockers':['solid']}
        parts=clear_stairs([cube], [clearance])
        self.assertEqual(len(parts),6)
        def inside(b,p):return all(sum(a*v for a,v in zip(n[:3],p))<=n[3]+1e-6 for n in b['planes'])
        self.assertFalse(any(inside(b,[0,5,0]) for b in parts))
        for p in [[4,5,0],[-4,5,0],[0,5,4],[0,5,-4],[0,1,0],[0,9,0]]:
            self.assertTrue(any(inside(b,p) for b in parts),p)
        self.assertEqual(clear_stairs(parts,[clearance]),parts,'archive repair is idempotent')
        untouched={**cube,'id':'native-stair-ramp'}
        self.assertIn(untouched,clear_stairs([cube,untouched],[clearance]))

if __name__=='__main__':unittest.main()

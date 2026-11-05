"""Offline georeference checks: python -m unittest discover -s scripts/maps."""
import json
import unittest
import numpy as np
from prepare_history import ROOT, fit_projective, georeference, mercator, project


class GeoreferenceTests(unittest.TestCase):
    def test_projective_recovery_and_inverse(self):
        # A synthetic scan with perspective: an affine-only implementation cannot pass.
        pixels = np.array([[0, 0], [18000, 0], [18000, 12000], [0, 12000], [9000, 6000]])
        expected = np.array([[1, .02, 2050000], [.04, -1, 6470000], [1e-7, -2e-7, 1]])
        world = project(pixels, expected)
        matrix = fit_projective(pixels, world)
        probes = np.array([[6000, 3000], [17000, 11000], [2000, 8000]])
        np.testing.assert_allclose(project(probes, matrix), project(probes, expected), atol=1e-6)
        np.testing.assert_allclose(project(project(probes, matrix), np.linalg.inv(matrix)), probes, atol=1e-6)

    def test_spatial_holdout_and_reference_agreement(self):
        config = json.loads((ROOT / 'scripts/maps/history-controls.json').read_text())
        cells = lambda controls: {(int(c['pixel'][0] // 2000), int(c['pixel'][1] // 2000)) for c in controls}
        self.assertFalse(cells(config['controls']) & cells(config['validationControls']))
        self.assertGreater(len(cells(config['controls'])), 20)
        matrix, residuals = georeference(config)
        self.assertLess(np.percentile(residuals, 90), 4)
        # Old central-building affine fit must fail the same held-out checks.
        old = config['previousCentralControls']
        affine = np.linalg.lstsq(np.array([[*c['pixel'], 1] for c in old]), np.array([mercator(*c['coordinates']) for c in old]), rcond=None)[0]
        truth = np.array([mercator(*c['coordinates']) for c in config['validationControls']])
        predictions = np.array([[*c['pixel'], 1] for c in config['validationControls']]) @ affine
        old_errors = np.linalg.norm(predictions - truth, axis=1) * np.cos(np.radians(50.1))
        self.assertLess(np.median(residuals), np.median(old_errors) / 10)
        print(f'Holdout: old median {np.median(old_errors):.2f} m; new median {np.median(residuals):.2f} m; max {residuals.max():.2f} m')

    def test_rejects_bad_validation(self):
        config = json.loads((ROOT / 'scripts/maps/history-controls.json').read_text())
        for c in config['validationControls']:
            c['coordinates'][0] += .01
        with self.assertRaises(ValueError):
            georeference(config)


if __name__ == '__main__':
    unittest.main()

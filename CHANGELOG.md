# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 17 Illinois US House representatives to `officials.yaml`, bringing the total to 263 elected officials.

### Improved

- District shape resolution on the map: reduced simplification tolerance from 0.002 to 0.0005 and switched to the higher-quality Visvalingam-Whyatt algorithm, producing smoother boundaries for all district layers and the jurisdiction boundary.

## [0.1.0] - 2026-02-07

### Added

- Next.js fullstack app scaffold for elected official lookup.
- Pluggable geocoding providers (default: geocode.earth) with autocomplete + reverse endpoints.
- District resolution via GeoJSON point-in-polygon across configured district layers.
- Officials resolver with config-driven office slots and `officials.yaml` data file.
- District shape generation and per-office embedded maps via a pluggable map adapter (default: Protomaps).
- CI workflow for lint + tests.


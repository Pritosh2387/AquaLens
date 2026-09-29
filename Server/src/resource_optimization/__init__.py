"""src/resource_optimization/__init__.py"""
from .or_tools_optimizer import ORToolsResourceOptimizer

# Legacy greedy allocator kept in allocator.py for reference only.
# ORToolsResourceOptimizer is the active solver for all production use.
__all__ = ["ORToolsResourceOptimizer"]

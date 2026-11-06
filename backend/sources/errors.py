class SourceUnavailable(Exception):
    """An external catalogue (AniList, Open Library) couldn't be reached or returned an error."""


class TitleNotFound(Exception):
    """The external catalogue has no title with the requested id."""

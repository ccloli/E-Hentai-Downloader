from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from desktop_gui.output_layout import (
    CBZ_ROOT_NAME,
    JPG_ROOT_NAME,
    VIDEO_ROOT_NAME,
    cbz_source_directory,
    image_source_directory,
    migrate_legacy_output,
    plan_legacy_migration,
    source_folder_name,
    video_source_directory,
)


class OutputLayoutTests(unittest.TestCase):
    def test_source_urls_have_deterministic_separate_roots(self) -> None:
        comic_url = "https://gamebus001.com/comic/941"
        chapter_url = "https://gamebus001.com/chapter/1682"
        gallery_url = "https://e-hentai.org/g/4073508/93195150e3/"

        self.assertEqual(source_folder_name(comic_url), "gamebus-comic-941")
        self.assertEqual(
            source_folder_name(chapter_url),
            "gamebus-chapter-1682",
        )
        self.assertEqual(
            source_folder_name(gallery_url),
            "e-hentai-gallery-4073508-93195150e3",
        )

        root = Path("D:/downloads")
        self.assertEqual(
            image_source_directory(root, comic_url),
            root / JPG_ROOT_NAME / "gamebus-comic-941",
        )
        self.assertEqual(
            cbz_source_directory(root, comic_url),
            root / CBZ_ROOT_NAME / "gamebus-comic-941",
        )

    def test_huangguo_episodes_share_one_series_folder(self) -> None:
        first = "https://huangguoai.com/video/117/"
        fifth = "https://huangguoai.com/video/117/ep-5/"

        self.assertEqual(source_folder_name(first), "huangguo-video-117")
        self.assertEqual(source_folder_name(fifth), "huangguo-video-117")

        root = Path("D:/downloads")
        self.assertEqual(
            video_source_directory(root, fifth),
            root / VIDEO_ROOT_NAME / "huangguo-video-117",
        )

    def test_migrates_legacy_outputs_without_touching_unrelated_files(self) -> None:
        comic_url = "https://gamebus001.com/comic/941"
        gallery_url = "https://e-hentai.org/g/4073508/93195150e3/"
        comic_name = "gb-941-0001-1682 - Comic - 001 - Chapter"
        gallery_name = "4073508 - Gallery"

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            comic_directory = root / comic_name
            comic_directory.mkdir()
            (comic_directory / "001 - page.jpg").write_bytes(b"comic")
            (root / f"{comic_name}.cbz").write_bytes(b"comic archive")

            gallery_directory = root / gallery_name
            gallery_directory.mkdir()
            (gallery_directory / "001 - page.jpg").write_bytes(b"gallery")
            (root / f"{gallery_name}.cbz").write_bytes(b"gallery archive")

            unrelated = root / "keep-me"
            unrelated.mkdir()

            plan = plan_legacy_migration(root, [comic_url, gallery_url])
            self.assertEqual(len(plan), 4)

            summary = migrate_legacy_output(root, [comic_url, gallery_url])

            self.assertEqual(summary.image_directories, 2)
            self.assertEqual(summary.archives, 2)
            self.assertTrue(
                (
                    image_source_directory(root, comic_url)
                    / comic_name
                    / "001 - page.jpg"
                ).is_file()
            )
            self.assertTrue(
                (
                    cbz_source_directory(root, comic_url)
                    / f"{comic_name}.cbz"
                ).is_file()
            )
            self.assertTrue(
                (
                    image_source_directory(root, gallery_url)
                    / gallery_name
                    / "001 - page.jpg"
                ).is_file()
            )
            self.assertTrue(
                (
                    cbz_source_directory(root, gallery_url)
                    / f"{gallery_name}.cbz"
                ).is_file()
            )
            self.assertTrue(unrelated.is_dir())
            self.assertEqual(
                migrate_legacy_output(
                    root,
                    [comic_url, gallery_url],
                ).moved_items,
                0,
            )

    def test_migration_preserves_conflicting_files(self) -> None:
        comic_url = "https://gamebus001.com/comic/941"
        comic_name = "gb-941-0001-1682 - Comic - 001 - Chapter"

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            legacy = root / comic_name
            legacy.mkdir()
            (legacy / "001 - page.jpg").write_bytes(b"legacy")

            destination = image_source_directory(root, comic_url) / comic_name
            destination.mkdir(parents=True)
            (destination / "001 - page.jpg").write_bytes(b"new")

            summary = migrate_legacy_output(root, [comic_url])

            self.assertEqual(summary.renamed_conflicts, 1)
            self.assertEqual(
                (destination / "001 - page.jpg").read_bytes(),
                b"new",
            )
            self.assertEqual(
                (destination / "001 - page.legacy-1.jpg").read_bytes(),
                b"legacy",
            )
            self.assertFalse(legacy.exists())


if __name__ == "__main__":
    unittest.main()

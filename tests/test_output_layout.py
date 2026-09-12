from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from desktop_gui.output_layout import (
    CBZ_ROOT_NAME,
    JPG_ROOT_NAME,
    VIDEO_ROOT_NAME,
    cbz_source_directory,
    derive_source_title,
    image_source_directory,
    migrate_legacy_output,
    migrate_source_folders_to_titles,
    plan_legacy_migration,
    plan_title_migration,
    source_folder_name,
    video_source_directory,
)


class OutputLayoutTests(unittest.TestCase):
    def test_legacy_gallery_folders_are_reused_after_rename(self) -> None:
        url = "https://e-hentai.org/g/4073508/93195150e3/"
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            legacy = root / JPG_ROOT_NAME / "e-hentai-gallery-4073508-93195150e3"
            legacy.mkdir(parents=True)
            self.assertEqual(image_source_directory(root, url), legacy)
            self.assertEqual(image_source_directory(root, url, "Title"), legacy)
            titled = root / JPG_ROOT_NAME / "Title"
            titled.mkdir()
            self.assertEqual(image_source_directory(root, url, "Title"), titled)

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
            "comic-gallery-4073508-93195150e3",
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

    def test_titles_replace_url_slugs_in_source_folders(self) -> None:
        comic_url = "https://gamebus001.com/comic/629"
        root = Path("D:/downloads")

        self.assertEqual(
            cbz_source_directory(root, comic_url, "逆轉花舞篇/逆转花舞篇"),
            root / CBZ_ROOT_NAME / "逆轉花舞篇_逆转花舞篇",
        )
        self.assertEqual(
            image_source_directory(root, comic_url, "逆轉花舞篇/逆转花舞篇"),
            root / JPG_ROOT_NAME / "逆轉花舞篇_逆转花舞篇",
        )
        self.assertEqual(
            image_source_directory(root, comic_url),
            root / JPG_ROOT_NAME / "gamebus-comic-629",
        )

    def test_existing_slug_folder_is_reused_until_migrated(self) -> None:
        comic_url = "https://gamebus001.com/comic/629"
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            legacy = root / JPG_ROOT_NAME / "gamebus-comic-629"
            legacy.mkdir(parents=True)

            self.assertEqual(
                image_source_directory(root, comic_url, "逆轉花舞篇"),
                legacy,
            )

            titled = root / JPG_ROOT_NAME / "逆轉花舞篇"
            titled.mkdir(parents=True)
            self.assertEqual(
                image_source_directory(root, comic_url, "逆轉花舞篇"),
                titled,
            )

    def test_derives_titles_from_existing_names(self) -> None:
        self.assertEqual(
            derive_source_title(
                "gb-629-0001-957 - 逆轉花舞篇_逆转花舞篇 - 001 - 花舞篇01.cbz"
            ),
            "逆轉花舞篇_逆转花舞篇",
        )
        self.assertEqual(
            derive_source_title("4073508 - 青鸾殇1_old"),
            "青鸾殇1_old",
        )
        self.assertEqual(
            derive_source_title("hm-qingluan-1 - 青鸾殇 - 1"),
            "青鸾殇 - 1",
        )
        self.assertEqual(derive_source_title("something-unrecognized"), "")

    def test_migrates_slug_folders_to_title_folders(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            comic_cbz = root / CBZ_ROOT_NAME / "gamebus-comic-629"
            comic_cbz.mkdir(parents=True)
            for index, chapter in ((1, "花舞篇01"), (2, "花舞篇02")):
                (
                    comic_cbz
                    / f"gb-629-000{index}-95{index} - 花舞篇 - 00{index} - {chapter}.cbz"
                ).write_bytes(b"archive")

            comic_jpg = root / JPG_ROOT_NAME / "gamebus-comic-629"
            chapter_dir = comic_jpg / "gb-629-0001-957 - 花舞篇 - 001 - 花舞篇01"
            chapter_dir.mkdir(parents=True)
            (chapter_dir / "001 - page.jpg").write_bytes(b"page")

            gallery_jpg = root / JPG_ROOT_NAME / "e-hentai-gallery-4073508-93195150e3"
            gallery_dir = gallery_jpg / "4073508 - 青鸾殇1_old"
            gallery_dir.mkdir(parents=True)
            (gallery_dir / "001 - page.jpg").write_bytes(b"gallery page")

            video = root / VIDEO_ROOT_NAME / "huangguo-video-117"
            episode_dir = video / "117 - 高三爱情故事"
            episode_dir.mkdir(parents=True)
            (episode_dir / "001 - 高三爱情故事.mp4").write_bytes(b"video")

            self.assertEqual(len(plan_title_migration(root)), 5)
            summary = migrate_source_folders_to_titles(root)

            self.assertEqual(summary.moved_items, 5)
            self.assertEqual(summary.archives, 2)
            self.assertEqual(summary.image_directories, 3)

            self.assertEqual(
                sorted(
                    path.name
                    for path in (root / CBZ_ROOT_NAME / "花舞篇").iterdir()
                ),
                [
                    "gb-629-0001-951 - 花舞篇 - 001 - 花舞篇01.cbz",
                    "gb-629-0002-952 - 花舞篇 - 002 - 花舞篇02.cbz",
                ],
            )
            self.assertEqual(
                (
                    root
                    / JPG_ROOT_NAME
                    / "花舞篇"
                    / "gb-629-0001-957 - 花舞篇 - 001 - 花舞篇01"
                    / "001 - page.jpg"
                ).read_bytes(),
                b"page",
            )
            self.assertEqual(
                (
                    root
                    / JPG_ROOT_NAME
                    / "青鸾殇1_old"
                    / "4073508 - 青鸾殇1_old"
                    / "001 - page.jpg"
                ).read_bytes(),
                b"gallery page",
            )
            self.assertTrue(
                (
                    root
                    / VIDEO_ROOT_NAME
                    / "高三爱情故事"
                    / "117 - 高三爱情故事"
                    / "001 - 高三爱情故事.mp4"
                ).is_file()
            )

            self.assertFalse(comic_cbz.exists())
            self.assertFalse(comic_jpg.exists())
            self.assertFalse(gallery_jpg.exists())
            self.assertFalse(video.exists())

            self.assertEqual(plan_title_migration(root), ())

    def test_title_migration_leaves_unrecognized_entries_alone(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            folder = root / CBZ_ROOT_NAME / "gamebus-comic-629"
            folder.mkdir(parents=True)
            (folder / "notes.txt").write_bytes(b"keep me")

            self.assertEqual(plan_title_migration(root), ())
            summary = migrate_source_folders_to_titles(root)

            self.assertEqual(summary.moved_items, 0)
            self.assertEqual((folder / "notes.txt").read_bytes(), b"keep me")

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

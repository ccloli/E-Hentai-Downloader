from __future__ import annotations

import tkinter as tk
from tkinter import ttk


class CollapsibleSection(ttk.Frame):
    def __init__(self, master: tk.Misc, title: str) -> None:
        super().__init__(master)
        self.title = title
        self.expanded = True
        self.columnconfigure(0, weight=1)
        self.header = ttk.Button(self, command=self.toggle, takefocus=True)
        self.header.grid(row=0, column=0, sticky=tk.EW)
        self.header.bind("<Return>", self._on_return)
        self.body = ttk.Frame(self, padding=8, relief=tk.GROOVE, borderwidth=1)
        self.body.grid(row=1, column=0, sticky=tk.NSEW)
        self._update_header()

    def toggle(self) -> None:
        self.expanded = not self.expanded
        if self.expanded:
            self.body.grid()
        else:
            self.body.grid_remove()
        self._update_header()

    def _on_return(self, event: tk.Event) -> str:
        self.toggle()
        return "break"

    def _update_header(self) -> None:
        marker, action = ("[-]", "折叠") if self.expanded else ("[+]", "展开")
        self.header.configure(text=f"{marker} {self.title}（{action}）")

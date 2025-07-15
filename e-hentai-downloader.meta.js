// ==UserScript==
// @name         E-Hentai Downloader
// @version      1.36.1
// @description  Download E-Hentai archive as zip file (with x-info patch by dnsev-h)
// @author       864907600cc, dnsev-h
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAAB7FBMVEX78uXmXu/r7PPo6O/u8fni4u7Mua/YycD////j6vTQv7f67uDHsqnp2czPvLHx+f3Yxbby18X75dT34dHg0cn96tj46tvBqqTVvrDRw7zr9v3a3Oq5oZvv0L7W1uXrxq3VuafpzLTv3s+1mZC8npPXw8fn4unOxNrQxtLErKA2NT25u8Xq0MLk7/nY5PPhy7jdwav23MrIubbb1uHi3ebYzt3y4tnmz73MrJjP2On16eDSzOC9wdbj1M3euqXAppxAO0fn1tTjx7DGppPeXefp3N3Ms6LQzNfZzNTKwdSovL3CtLDnvqTTsp3O0uTkwrXpffDCv8ysZnJxbW/86v21vdXizMG1trpePma7yePh2d7IzN7Q09vKtsqttsLdu7OPSpdPO1bR3u+2zMm+VMfHvb2/rLTExdvDsrd/fYHuoPPobfDNWNbCzMzPwsq1U76dTaXyq/fqjPHt4+Ld0tjH0NKwtdGhrsXLr7ujsrbbr6fEZXtzQ3v3yfr0t/jUWd2oxcbJwsa5q7yXvLikpbLSop6lmpaOioz+9f7B1u7CxtGurMufoKnPjpTDooy5YXViYGJPT1L51/vUsrS1rbDmkZu8jo6qhY2BRojLboK5fYGofH2Wqqm3bHm70s7Utb7vmKXce47pwsiznrPyMIauAAAM4klEQVRYw2zW3VMSURgGcIbds7QEyLIExeaK1K44UJpAX2gNNiVkyeiMNGDETE3ojd2kZnSVZTPa10VlU/Y5/aM973tYq5meXZay5sfznrOu+sKIkTHC4fy5c8ODxnA/Q8PG4NDQDcrQXxkepBiGcYZjmrFY7Ahy+LDPSz5sGOF8/lwY3vCwgQt7Q4PG0P9AEj3QhMcgix7J1ZD8ubGx4WlUZI8LMlh/+LDSqP/dMJ+H6HkH4BGvIWFjCF2mp6eNQXh4H6SBL126VFdUxJ2qc8bwwRSuaCLg+uBBRcL6YBQQmk0DxMCXKB1XlfG3Wq6CuFevVuK0TP805Ip9MNrPGF4Ax2moYZzEjXdcv+qnEOmirIxytRI2AALjhmx6FcmR4LjMNHHT7EWLrCke6ZdlcSpr8bDXkDnuyOTRftjjgEpTxjstQKKIuC6TkDhKUfiFWzFjJgry4QVkJJLmjJMKLX0TSSNHOy3ddV2FIp2+phS5uOt3MzGQCA/tgZqmXbuWjqSPgjgKTYb+4ghaNAg4cHqeW8QnSFGpMOe9WPSFQtcoBKbPU26eZy+6pnJY8TxQRVcRUqR1gMgdpZmIJRIAR0dHSbx25coVBnneNVqygQEGWeOeTApRKJIoqn6IJkiJmiTGfOAIHD0Jj8j0+Hg06gji4Hmg4pHwCtnVgkLJFlj8OxIMjZ7kvIFHDSNVXdUVcDo7ipS8oW+vrn67LcF1y68qFfMMHdDO4jABXoZ1Qnpv3lw5fy2yputCoKAiVDje4f2hsH7v3jo+BGD2tsBShjOZjJHhmAAvnzyBwEM7BrWC0AtWamDAT54XKfLI6/dyT/ugLfC1VjgT5jDpg4agIrqdhxcqCVEqwVNFikAhDkTyeOZv6wr52RFLF/jiFDADJ5M+6VEu02aHbCGqjgrPpS3GFog/pNwUa3d1nctmZ/AvRRqawyKDLB4HOBrSZiwr6wgUVFQGSwS6nkiHEEvzByCudDdCo5p/QC5I4APbzjpVWkA/3zUCC2CJIjSgMpZ9YTcrRy7hqip+tTUVjnskg8wBDK3M2dkgCqZU4Xm6kDMXJIeCtbnlGQkW6O5XcAYacYgHIMY9fhz9RpMjc7WJoHMqlSqoKoPWKV3oFu5uUQAlwZHddQmW+PZX8D8DeP414hKExeGCSzUtGCykUkKoiG5l9VOWqguVaL0oPXF7fhWgAhDlsNgDhw5NRaN4AAbi3NDzUHB+eUUL3tdTelm3BLZzpI1bSC8VCRQq3SEAdTu7Kr9TSn54DFbgIdGxBo1MGrxkMjnZRcEHqZRt6yVUqW0+sNszwumDePMLBYs6s1rgkYsqgS5erejRSJrJqGyIcQFubYW04LHSqdMjQpTRr5tst0MPSp2W4hdYL4tdRcdKWAwqDCp4FalhmkkGk5RQ8ldSQ0Ohl2vCLlv2fPfd0vdeOVtfE3jCCL3KoMCDY6YID+GdA6i6WEMiER+8PnkcHpbwtNVesnJlq7zV26zVO2UnX8XOtgvCEbouLNovSxx4KXqTYAQBKDkGQwAnnt5dnp+7cKts15K99rvBRrljVIVV+161HKdQmMnalpoSMDxQ4Z+wAQlqkYjvYGKcIUxcu/By8sLk9aW5re1e94bRyNbNqmW3vzu2ExdiZmV+xDoFkMKgILsYiAZlQ4AIKCIBahPLzY3mzp3rk8u/trf3bpxptAdNxy633wHMF7BR87u7Fj3c+uCAgKcAxNDUUOOGUqOGEyvNxcXmzuNnGxsf9xcWPvfGNo1Y3B5pd+q2c6Zq11Zu5XYv1PSU9DywFcDMiKYBZI9FWsNu82Vzsfn82aNH+/sLyN62EZsqtzfr+ZJjxu3a5kQutzQnhAeqABWAUQQjo2HI87CAEtxZXHz07Mur/SSBX1+fSWRG2psYPGtmssvdwK3cvI3nKoOpAfkUXyMwCA4NYUmOyYn3AF9uELjtLLx9+/brtplIOJvvMHgtbDrLW43ZXE4ION4SShC74oHgNCSEzM5q3cWNnUcEvuhd/f7kyZNPU/jhHdU6ZiKz+S6fz21Fo7ckSJ4HVgOBwLEgMREf1YsEI1oI5qw20d3Y2Fl8BPDjjYsPPz35tH0xcTjR0AZjicbJvc+fP/46Hp196oHeEgKEh4qAfLIfkZTZ7svFZvMlwOP18OufP3/4LuL3vnwUcycqn78uLHz8uD/6QCgEprCEuk4FhUMgR/Np6CbJILzZ7vPJ5k7zzrPHgYbx+sOPD/EEwLBBV4BvIe7vVQEqDMqJPZBNX+TAiwQBrryfXL579/rj6wHT7PR6vRh+QTsMDm+V109ol/b2qvBo5BSDSh8Ex+DvPuz/NYkwjgO4j+269Drb5iG7XQkJdeNsBouMuQ1ucGO1gTm0lDaWLkdplmt9ocBaxdKIBesbrH6I6i/t/fk8XmlWb0LWD736PM/neT53DtdPcsSC9EEjGo1F0RAtIKMFhn58Rpe+fHh8njyI1pvibnINHkCkCx6FNkweZyp8K7m6kV1PFnW8TkWpMAQf+OnHNzTp+9vMRXn2HuadSqlUcfLJLmhi2aYZoPL4ULI3NXVrZTV1c/bKS53XyRpC63717dP3Tz8W0tLbdQ52BOKV3c45gOAYDURgEUlgmMDpbGp1YzY5111sJsABeP3t20+f5jOJIIF7blOIXL2+LUSjlGeL/wBECEWPQBIYx5CfTd4lkEwfHI2OnL1+PTq6AK6471ZF/fURpLAtvFKel8wfXRCBCHBzc5oG82zyji5FH43hTY2aFLsfPF1ztzxRh8Z5JnYqHYM1WrI6HBnDirkr6Pzmiy749U5aUpq/ZJCjoxq2cK/kCXGbMc49UXWWVZCyQtWfFNRjVZ2YDjF44+sL3sW0ziKRMDUtHQx2ymjGPUh+cuJgnzluCp74KjxuCrZh0Qdv3DCk+AtkFFtYrDSEeNYDFoTntlWZwNgwVqzKJtP1WYszuP78uS9y/LMTBah0nBa2sCd1sfXOByOcMIrkxphxAi2ASxDn+lutRUfOnKb3kZeOlzvSX2Kl3QdCVMOHAW5aDF5Zf/4ENSbR6t9bOArvapBAG6ew8PcScZf9UQMSYOoXuLS0VFwmUfM5fJufJ3DGrrXE0z9KdI8bDIbhgaOgSvMFgQrAJQI/Fjf1GJExaPS7hhMLXKC9VxLvC6+75zAncq/r4iBvGFwhRgM/AVg0JrhCCRaLADdNdfjCGVicM3gtRIH2bkvkBIOFnEDqBdFw8M8NgNg/cAiB5iKDCsCPpsoxzcgJ9qhAQxYYL1Zwk9m7DY6O+bYotQ0kAAwTjMEwssZLxrFZN0ZjnMSJywCJw6oXUGDcvqQo+6UGia/vCZkj78XWPoOQEBTJN2XKSs3Ig51MxDROdOSkXyAODReIrxrxfEls80VG+CJ6Dcc0DB0gHswQTZBT9DJnE3gzmUz7U2Hk5IgfA6+bcZv/y3yZb982e7DxU+W4rgOkcFPCAF+kML2Q1eSKvHc4MPovT7/4pFbbtZUQWLfJB0duIf34VBx0GGSOVTxn7C6YXZGjQSMxIblE1HhX2cKAxveD0LqzQ11+zxz3p4BNJBBzQXo8G7JdML5CA5ZFOoT0NRMP/P2WEDgea0Oh6T2HB5jsiZwUouoSSJeEPT411sYGg5YP8rTREHyGXU8gZfed4zgV7klOggUGdxwVICiQSATz9m5qOsWgcumU9muy+ne53RKcRrXZrDaorIK/YgY9BuXuRai8sLkI0GLQPkWen0yaUiuL3rz3V4x291bIy8VE5NllWSklRDnfD3KJ+a0+sMA9ZnoAxGilO2am4ilFCWGghCwDSG8GQTopMvwALHBTEgRGTDkQ1bvYQBRIXxSUee1PMNO/5NuyJf4u0t3LJxKokHsCELNiMWUBnFTGcdIWBsD7ey3RGy7Qz1Ps54HbRoUY1PAA4lkVt0I+GBwAtfsrrtcLbssd9PuCvzWdMA42RIBjBFr/AzPXJvdbVaTZFIN5xlOidFwP0HmGR1+fT/ng0F9AbWHomFJzcaTdihgML99zlwlEP4bH1Kv+M34S4PggmAkeo1fg7KWJ5dKgl/O8VrlcyRsMQtRVrHgt+28wc+gYwPHUjL0AcDDVSr5Wa9M5xPezMZU41cwu9oDX+kF4XKB9MWO6A1zjwOnggTKnGwAjuCUItnA1LsFD4+hKP3if65u0ZibSmTlMrp541XLJyS8bHFSI8sYYVCdWFAZDQbzfDz3Qer0hBkMz9oNYOp0v+9hOE5ibb0/B8kE0ZJhiqjZWDHAIv6gCeD7T1xAucNqeiMX0aNjZ8rxGs9yqOO9qu6uT5+bnut7cnBFAfRy1+5qkTA6Cp+FxRy7Nx9J6QpvCQITV2X20MZ2dHLcIotBnYPiq9ADyZA2NA8TqGOxfcJYKTAAMZHQdA3xzdnZjYxXnVtYm8xPrjOp8U2+kXwAAAABJRU5ErkJggg==
// @include      http://exhentai.org/g/*
// @include      http://e-hentai.org/g/*
// @include      http://g.e-hentai.org/g/*
// @include      http://r.e-hentai.org/g/*
// @include      http://exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion/g/*
// @include      https://exhentai.org/g/*
// @include      https://e-hentai.org/g/*
// @include      https://g.e-hentai.org/g/*
// @include      https://r.e-hentai.org/g/*
// @namespace    http://ext.ccloli.com
// @updateURL    https://github.com/ccloli/E-Hentai-Downloader/raw/dnsev-h_x-info/e-hentai-downloader.meta.js
// @downloadURL  https://github.com/ccloli/E-Hentai-Downloader/raw/dnsev-h_x-info/e-hentai-downloader.user.js
// @supportURL   https://github.com/ccloli/E-Hentai-Downloader/issues
// @connect      e-hentai.org
// @connect      exhentai.org
// @connect      exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion
// @connect      hath.network
// @connect      *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM.info
// ==/UserScript==

<!--
.. title: Audio Spektrogramme mit Python erstellen
.. slug: create-audio-spectrograms-with-python
.. date: 2013-07-28
.. tags:
.. category: Code-Snippets
.. link:
.. description:
.. type: text
-->


<div class="alert alert-warning">
  <strong>Warnung!</strong> Die Informationen auf dieser Seite sind veraltet. Für eine bessere Art und Weise, Spektrogramme mit logarithmischer Frequenzachse in Python zu visualisieren, empfehle ich die exzellenten Notebooks über <a href="https://www.audiolabs-erlangen.de/FMP">Fundamentals of Music Processing</a>, im speziellen jene über <a href="https://www.audiolabs-erlangen.de/resources/MIR/FMP/C3/C3S1_SpecLogFreq-Chromagram.html">Log-Frequency Spectrograms</a>.
</div>

Hier geht es um das Erstellen von Spektogrammen aus WAVE Dateien mit Python, einschließlich Dezibel konvertierter Werte und einer logarithmisch skalierten Frequenz-Achse. Es wird NumPy, SciPy und matplotlib benötigt. Da es sich um einen älteren Codeschnipsel handelt, wird auch eine eher alte Version von NumPy benötigt, z.B. 1.10.4. Wenn Anaconda benutzt wird, kann eine passende Umgebung mit folgendem Befehl eingerichtet werden: `conda create -n spec python=3 numpy==1.10.4 scipy matplotlib`. Wenn jemand Kommentare, Verbesserungsvorschläge hat oder es einfach nützlich findet, freue ich mich über [Kontakt](/de/about-me.html).

Ein Beispiel: das Spektogramm der ersten 10 Sekunden von dem Lied »Die Schnitzelbank« (gesungen vom Manhattan Quartett, wahrscheinlich in den 1920ern, Quelle: [»American Memory« des Libary of Congress, Washington, D.C.](http://memory.loc.gov/cgi-bin/query/r?ammem/papr:@filreq(@field(NUMBER+@band(edrs+57007r))+@field(COLLID+edison)))).

<div style="text-align:center">
  <audio controls>
   <source src="/media/schnitzel.mp3" type="audio/mpeg">
   Your browser does not support the audio tag.
  </audio>
</div>

<!-- ![Frank](/images/frank_circle.jpg) -->
<div style="text-align:center">
  <a href="/images/schnitzelspec.jpg">
    <img src="/images/schnitzelspec_small.jpg" />
  </a>
</div>

```python
#coding: utf-8
""" This work is licensed under a Creative Commons Attribution 3.0 Unported License.
    Frank Zalkow, 2012-2013 """

import numpy as np
from matplotlib import pyplot as plt
import scipy.io.wavfile as wav
from numpy.lib import stride_tricks

""" short time fourier transform of audio signal """
def stft(sig, frameSize, overlapFac=0.5, window=np.hanning):
    win = window(frameSize)
    hopSize = int(frameSize - np.floor(overlapFac * frameSize))

    # zeros at beginning (thus center of 1st window should be for sample nr. 0)
    samples = np.append(np.zeros(np.floor(frameSize/2.0)), sig)
    # cols for windowing
    cols = np.ceil( (len(samples) - frameSize) / float(hopSize)) + 1
    # zeros at end (thus samples can be fully covered by frames)
    samples = np.append(samples, np.zeros(frameSize))

    frames = stride_tricks.as_strided(samples, shape=(cols, frameSize),
                                      strides=(samples.strides[0]*hopSize,
                                      samples.strides[0])).copy()
    frames *= win

    return np.fft.rfft(frames)

""" scale frequency axis logarithmically """
def logscale_spec(spec, sr=44100, factor=20.):
    timebins, freqbins = np.shape(spec)

    scale = np.linspace(0, 1, freqbins) ** factor
    scale *= (freqbins-1)/max(scale)
    scale = np.unique(np.round(scale))

    # create spectrogram with new freq bins
    newspec = np.complex128(np.zeros([timebins, len(scale)]))
    for i in range(0, len(scale)):
        if i == len(scale)-1:
            newspec[:,i] = np.sum(spec[:,scale[i]:], axis=1)
        else:
            newspec[:,i] = np.sum(spec[:,scale[i]:scale[i+1]], axis=1)

    # list center freq of bins
    allfreqs = np.abs(np.fft.fftfreq(freqbins*2, 1./sr)[:freqbins+1])
    freqs = []
    for i in range(0, len(scale)):
        if i == len(scale)-1:
            freqs += [np.mean(allfreqs[scale[i]:])]
        else:
            freqs += [np.mean(allfreqs[scale[i]:scale[i+1]])]

    return newspec, freqs

""" plot spectrogram"""
def plotstft(audiopath, binsize=2**10, plotpath=None, colormap="jet"):
    samplerate, samples = wav.read(audiopath)
    s = stft(samples, binsize)

    sshow, freq = logscale_spec(s, factor=1.0, sr=samplerate)
    ims = 20.*np.log10(np.abs(sshow)/10e-6) # amplitude to decibel

    timebins, freqbins = np.shape(ims)

    plt.figure(figsize=(15, 7.5))
    plt.imshow(np.transpose(ims), origin="lower", aspect="auto", cmap=colormap,
               interpolation="none")
    plt.colorbar()

    plt.xlabel("time (s)")
    plt.ylabel("frequency (hz)")
    plt.xlim([0, timebins-1])
    plt.ylim([0, freqbins])

    xlocs = np.float32(np.linspace(0, timebins-1, 5))
    plt.xticks(xlocs, ["%.02f" % l for l in
                       ((xlocs*len(samples)/timebins)+(0.5*binsize))/samplerate])
    ylocs = np.int16(np.round(np.linspace(0, freqbins-1, 10)))
    plt.yticks(ylocs, ["%.02f" % freq[i] for i in ylocs])

    if plotpath:
        plt.savefig(plotpath, bbox_inches="tight")
    else:
        plt.show()

    plt.clf()

plotstft("my_audio_file.wav")
```

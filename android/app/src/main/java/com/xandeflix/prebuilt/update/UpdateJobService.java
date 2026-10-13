package com.xandeflix.prebuilt.update;

import android.app.job.JobService;
import android.app.job.JobParameters;

public final class UpdateJobService extends JobService {
    private Thread worker;
    @Override public boolean onStartJob(JobParameters parameters) {
        worker = new Thread(() -> {
            new UpdateEngine(this).check();
            if (!Thread.currentThread().isInterrupted()) jobFinished(parameters, false);
        }, "app-update-job");
        worker.start(); return true;
    }
    @Override public boolean onStopJob(JobParameters parameters) {
        if (worker != null) worker.interrupt(); return true;
    }
}
